const db = require("../database/db");

const {
  BUSINESS_TIME_ZONE,
} = require("../utils/date");

const MANUAL_REMINDER_COOLDOWN_MINUTES = 15;
const MAX_BULK_REMINDERS = 100;

const MANUAL_REMINDER_KIND =
  "ATTENDANCE_REMINDER";
const MANUAL_REMINDER_SOURCE =
  "ADMIN_MANUAL";

function createServiceError(
  message,
  statusCode,
  code
) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function toCount(value) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function normalizeSummary(row = {}) {
  return {
    matched: toCount(row.matched),
    eligible: toCount(row.eligible),
    queued: toCount(row.queued),
    alreadyQueued: toCount(
      row.alreadyQueued
    ),
    cooldown: toCount(row.cooldown),
    withoutDevice: toCount(
      row.withoutDevice
    ),
    concurrentSkipped: toCount(
      row.concurrentSkipped
    ),
    remainingEligible: toCount(
      row.remainingEligible
    ),
  };
}

function getClassificationSql(
  appointmentAlias = "appointment"
) {
  return `
    CASE
      WHEN ${appointmentAlias}.has_active_job
        THEN 'ALREADY_QUEUED'
      WHEN ${appointmentAlias}.in_cooldown
        THEN 'COOLDOWN'
      WHEN NOT ${appointmentAlias}.has_active_device
        THEN 'WITHOUT_DEVICE'
      ELSE 'ELIGIBLE'
    END
  `;
}

function getCandidateSql() {
  return `
    SELECT
      appointment.id,
      (
        appointment.appointment_date
        + appointment.appointment_time
      ) AS appointment_at,
      EXISTS (
        SELECT 1
        FROM push_device_tokens AS device
        WHERE device.user_id = appointment.user_id
          AND device.active = TRUE
      ) AS has_active_device,
      EXISTS (
        SELECT 1
        FROM appointment_notification_jobs AS job
        WHERE job.appointment_id = appointment.id
          AND job.kind = '${MANUAL_REMINDER_KIND}'
          AND job.status IN ('QUEUED', 'CLAIMED')
      ) AS has_active_job,
      (
        COALESCE(
          appointment.reminder_sent_at >
            request_clock.requested_at
            - INTERVAL '${MANUAL_REMINDER_COOLDOWN_MINUTES} minutes',
          FALSE
        )
        OR EXISTS (
          SELECT 1
          FROM appointment_notification_jobs AS job
          WHERE job.appointment_id = appointment.id
            AND job.kind = '${MANUAL_REMINDER_KIND}'
            AND job.source = '${MANUAL_REMINDER_SOURCE}'
            AND job.status = 'SENT'
            AND job.sent_at >
              request_clock.requested_at
              - INTERVAL '${MANUAL_REMINDER_COOLDOWN_MINUTES} minutes'
        )
      ) AS in_cooldown
    FROM appointments AS appointment
    CROSS JOIN request_clock
    WHERE appointment.status = 'ACCEPTED'
      AND appointment.client_attendance_confirmed_at IS NULL
      AND (
        appointment.appointment_date
        + appointment.appointment_time
      ) > (
        request_clock.requested_at
        AT TIME ZONE '${BUSINESS_TIME_ZONE}'
      )
  `;
}

async function getAttendanceReminderSummary() {
  const result = await db.query(
    `
      WITH request_clock AS MATERIALIZED (
        SELECT clock_timestamp() AS requested_at
      ),
      candidates AS MATERIALIZED (
        ${getCandidateSql()}
      ),
      classified AS MATERIALIZED (
        SELECT
          candidate.*,
          ${getClassificationSql("candidate")}
            AS classification
        FROM candidates AS candidate
      )
      SELECT
        COUNT(*)::int AS matched,
        COUNT(*) FILTER (
          WHERE classification = 'ELIGIBLE'
        )::int AS eligible,
        0::int AS queued,
        COUNT(*) FILTER (
          WHERE classification = 'ALREADY_QUEUED'
        )::int AS "alreadyQueued",
        COUNT(*) FILTER (
          WHERE classification = 'COOLDOWN'
        )::int AS cooldown,
        COUNT(*) FILTER (
          WHERE classification = 'WITHOUT_DEVICE'
        )::int AS "withoutDevice",
        0::int AS "concurrentSkipped",
        0::int AS "remainingEligible"
      FROM classified
    `
  );

  return normalizeSummary(result.rows[0]);
}

async function queueAttendanceReminders(
  requestedByUserId
) {
  const result = await db.query(
    `
      WITH request_clock AS MATERIALIZED (
        SELECT clock_timestamp() AS requested_at
      ),
      candidates AS MATERIALIZED (
        ${getCandidateSql()}
      ),
      classified AS MATERIALIZED (
        SELECT
          candidate.*,
          ${getClassificationSql("candidate")}
            AS classification
        FROM candidates AS candidate
      ),
      eligible AS MATERIALIZED (
        SELECT
          classified.id,
          classified.appointment_at
        FROM classified
        WHERE classified.classification = 'ELIGIBLE'
        ORDER BY
          classified.appointment_at ASC,
          classified.id ASC
      ),
      selected AS MATERIALIZED (
        SELECT eligible.id
        FROM eligible
        LIMIT ${MAX_BULK_REMINDERS}
      ),
      inserted AS (
        INSERT INTO appointment_notification_jobs (
          appointment_id,
          kind,
          source,
          requested_by_user_id,
          status,
          requested_at,
          available_at,
          accepted_devices,
          attempts
        )
        SELECT
          selected.id,
          '${MANUAL_REMINDER_KIND}',
          '${MANUAL_REMINDER_SOURCE}',
          $1,
          'QUEUED',
          request_clock.requested_at,
          request_clock.requested_at,
          0,
          0
        FROM selected
        CROSS JOIN request_clock
        ON CONFLICT DO NOTHING
        RETURNING appointment_id
      )
      SELECT
        (SELECT COUNT(*)::int FROM classified)
          AS matched,
        (SELECT COUNT(*)::int FROM eligible)
          AS eligible,
        (SELECT COUNT(*)::int FROM inserted)
          AS queued,
        (
          SELECT COUNT(*)::int
          FROM classified
          WHERE classification = 'ALREADY_QUEUED'
        ) AS "alreadyQueued",
        (
          SELECT COUNT(*)::int
          FROM classified
          WHERE classification = 'COOLDOWN'
        ) AS cooldown,
        (
          SELECT COUNT(*)::int
          FROM classified
          WHERE classification = 'WITHOUT_DEVICE'
        ) AS "withoutDevice",
        GREATEST(
          (SELECT COUNT(*)::int FROM selected)
          - (SELECT COUNT(*)::int FROM inserted),
          0
        )::int AS "concurrentSkipped",
        GREATEST(
          (SELECT COUNT(*)::int FROM eligible)
          - (SELECT COUNT(*)::int FROM selected),
          0
        )::int AS "remainingEligible"
    `,
    [requestedByUserId]
  );

  return normalizeSummary(result.rows[0]);
}

async function queueAppointmentAttendanceReminder(
  appointmentId,
  requestedByUserId
) {
  const result = await db.query(
    `
      WITH request_clock AS MATERIALIZED (
        SELECT clock_timestamp() AS requested_at
      ),
      candidate AS MATERIALIZED (
        SELECT
          appointment.id,
          appointment.status,
          appointment.client_attendance_confirmed_at,
          (
            appointment.appointment_date
            + appointment.appointment_time
          ) > (
            request_clock.requested_at
            AT TIME ZONE '${BUSINESS_TIME_ZONE}'
          ) AS is_future,
          EXISTS (
            SELECT 1
            FROM push_device_tokens AS device
            WHERE device.user_id = appointment.user_id
              AND device.active = TRUE
          ) AS has_active_device,
          EXISTS (
            SELECT 1
            FROM appointment_notification_jobs AS job
            WHERE job.appointment_id = appointment.id
              AND job.kind = '${MANUAL_REMINDER_KIND}'
              AND job.status IN ('QUEUED', 'CLAIMED')
          ) AS has_active_job,
          (
            COALESCE(
              appointment.reminder_sent_at >
                request_clock.requested_at
                - INTERVAL '${MANUAL_REMINDER_COOLDOWN_MINUTES} minutes',
              FALSE
            )
            OR EXISTS (
              SELECT 1
              FROM appointment_notification_jobs AS job
              WHERE job.appointment_id = appointment.id
                AND job.kind = '${MANUAL_REMINDER_KIND}'
                AND job.source = '${MANUAL_REMINDER_SOURCE}'
                AND job.status = 'SENT'
                AND job.sent_at >
                  request_clock.requested_at
                  - INTERVAL '${MANUAL_REMINDER_COOLDOWN_MINUTES} minutes'
            )
          ) AS in_cooldown
        FROM appointments AS appointment
        CROSS JOIN request_clock
        WHERE appointment.id = $1
      ),
      inserted AS (
        INSERT INTO appointment_notification_jobs (
          appointment_id,
          kind,
          source,
          requested_by_user_id,
          status,
          requested_at,
          available_at,
          accepted_devices,
          attempts
        )
        SELECT
          candidate.id,
          '${MANUAL_REMINDER_KIND}',
          '${MANUAL_REMINDER_SOURCE}',
          $2,
          'QUEUED',
          request_clock.requested_at,
          request_clock.requested_at,
          0,
          0
        FROM candidate
        CROSS JOIN request_clock
        WHERE candidate.status = 'ACCEPTED'
          AND candidate.client_attendance_confirmed_at IS NULL
          AND candidate.is_future = TRUE
          AND candidate.has_active_device = TRUE
          AND candidate.has_active_job = FALSE
          AND candidate.in_cooldown = FALSE
        ON CONFLICT DO NOTHING
        RETURNING
          id,
          appointment_id,
          kind,
          source,
          requested_by_user_id,
          status,
          requested_at,
          available_at,
          sent_at,
          accepted_devices,
          attempts
      )
      SELECT
        candidate.id AS "appointmentId",
        candidate.status AS "appointmentStatus",
        candidate.client_attendance_confirmed_at
          AS "clientAttendanceConfirmedAt",
        candidate.is_future AS "isFuture",
        candidate.has_active_device AS "hasActiveDevice",
        candidate.has_active_job AS "hasActiveJob",
        candidate.in_cooldown AS "inCooldown",
        inserted.id AS "jobId",
        inserted.kind,
        inserted.source,
        inserted.requested_by_user_id
          AS "requestedByUserId",
        inserted.status AS "jobStatus",
        inserted.requested_at AS "requestedAt",
        inserted.available_at AS "availableAt",
        inserted.sent_at AS "sentAt",
        inserted.accepted_devices AS "acceptedDevices",
        inserted.attempts
      FROM (SELECT 1) AS seed
      LEFT JOIN candidate ON TRUE
      LEFT JOIN inserted ON TRUE
    `,
    [appointmentId, requestedByUserId]
  );

  const row = result.rows[0] ?? {};

  if (!row.appointmentId) {
    throw createServiceError(
      "La cita no existe.",
      404,
      "APPOINTMENT_NOT_FOUND"
    );
  }

  if (row.appointmentStatus !== "ACCEPTED") {
    throw createServiceError(
      "Solo las citas confirmadas por la barbería pueden recibir recordatorios de asistencia.",
      409,
      "APPOINTMENT_NOT_ACCEPTED"
    );
  }

  if (row.clientAttendanceConfirmedAt) {
    throw createServiceError(
      "El cliente ya confirmó su asistencia.",
      409,
      "ATTENDANCE_ALREADY_CONFIRMED"
    );
  }

  if (!row.isFuture) {
    throw createServiceError(
      "La cita ya inició o terminó y ya no admite confirmación de asistencia.",
      409,
      "APPOINTMENT_ALREADY_STARTED"
    );
  }

  if (row.hasActiveJob) {
    throw createServiceError(
      "Ya hay un recordatorio programado para esta cita.",
      409,
      "REMINDER_ALREADY_QUEUED"
    );
  }

  if (row.inCooldown) {
    throw createServiceError(
      `Ya se envió un recordatorio recientemente. Espera ${MANUAL_REMINDER_COOLDOWN_MINUTES} minutos antes de enviar otro.`,
      409,
      "REMINDER_COOLDOWN"
    );
  }

  if (!row.hasActiveDevice) {
    throw createServiceError(
      "El cliente no tiene un dispositivo habilitado para recibir notificaciones.",
      422,
      "CLIENT_WITHOUT_PUSH_DEVICE"
    );
  }

  if (!row.jobId) {
    throw createServiceError(
      "Otra solicitud programó este recordatorio. Actualiza la lista antes de intentarlo nuevamente.",
      409,
      "REMINDER_CONCURRENTLY_QUEUED"
    );
  }

  return {
    id: row.jobId,
    appointmentId: row.appointmentId,
    kind: row.kind,
    source: row.source,
    requestedByUserId:
      row.requestedByUserId,
    status: row.jobStatus,
    requestedAt: row.requestedAt,
    availableAt: row.availableAt,
    sentAt: row.sentAt,
    acceptedDevices: row.acceptedDevices,
    attempts: row.attempts,
  };
}

module.exports = {
  MANUAL_REMINDER_COOLDOWN_MINUTES,
  MAX_BULK_REMINDERS,
  getAttendanceReminderSummary,
  queueAttendanceReminders,
  queueAppointmentAttendanceReminder,
};
