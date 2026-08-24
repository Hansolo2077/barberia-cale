const db = require("../database/db");

const {
  BUSINESS_TIME_ZONE,
} = require("../utils/date");

const BOOKING_POLICY = Object.freeze({
  minLeadHours: 24,
  maxActivePerDay: 1,
  maxActiveInSevenDays: 2,
  cancellationWindowMinutes: 60,
  businessTimeZone: BUSINESS_TIME_ZONE,
});

const AVAILABLE_TIMES = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

function getAttendanceProjection(
  tableAlias = "",
  {
    includeReminderSentAt = false,
    includeManualReminderState = false,
  } = {}
) {
  const prefix = tableAlias ? `${tableAlias}.` : "";
  const appointmentAt =
    `(${prefix}appointment_date + ${prefix}appointment_time)`;
  const activeManualReminderJob = `
    SELECT 1
    FROM appointment_notification_jobs AS reminder_job
    WHERE reminder_job.appointment_id = ${prefix}id
      AND reminder_job.kind = 'ATTENDANCE_REMINDER'
      AND reminder_job.source = 'ADMIN_MANUAL'
      AND reminder_job.status IN ('QUEUED', 'CLAIMED')
  `;
  const recentManualReminder = `
    SELECT 1
    FROM appointment_notification_jobs AS reminder_job
    WHERE reminder_job.appointment_id = ${prefix}id
      AND reminder_job.kind = 'ATTENDANCE_REMINDER'
      AND reminder_job.source = 'ADMIN_MANUAL'
      AND reminder_job.status = 'SENT'
      AND reminder_job.sent_at > NOW() - INTERVAL '15 minutes'
  `;
  const activePushDevice = `
    SELECT 1
    FROM push_device_tokens AS reminder_device
    WHERE reminder_device.user_id = ${prefix}user_id
      AND reminder_device.active = TRUE
  `;

  return `
    ${prefix}client_attendance_confirmed_at
      AS "clientAttendanceConfirmedAt",

    CASE
      WHEN ${prefix}status NOT IN ('ACCEPTED', 'COMPLETED')
        THEN 'NOT_APPLICABLE'
      WHEN ${prefix}client_attendance_confirmed_at IS NOT NULL
        THEN 'CONFIRMED'
      WHEN ${prefix}status = 'ACCEPTED'
        AND ${appointmentAt} >
          (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
        THEN 'AWAITING'
      WHEN ${prefix}status IN ('ACCEPTED', 'COMPLETED')
        THEN 'NO_RESPONSE'
      ELSE 'NOT_APPLICABLE'
    END AS "attendanceStatus",

    (
      ${prefix}client_attendance_confirmed_at IS NULL
      AND ${prefix}status = 'ACCEPTED'
      AND ${appointmentAt} >
        (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
    ) AS "canConfirmAttendance"
    ${includeReminderSentAt
      ? `,\n\n    ${prefix}reminder_sent_at AS "reminderSentAt"`
      : ""}
    ${includeManualReminderState
      ? `,

    EXISTS (${activePushDevice}) AS "hasActivePushDevice",

    EXISTS (${activeManualReminderJob}) AS "manualReminderPending",

    (
      SELECT MAX(reminder_job.sent_at)
      FROM appointment_notification_jobs AS reminder_job
      WHERE reminder_job.appointment_id = ${prefix}id
        AND reminder_job.kind = 'ATTENDANCE_REMINDER'
        AND reminder_job.source = 'ADMIN_MANUAL'
        AND reminder_job.status = 'SENT'
    ) AS "lastManualReminderSentAt",

    (
      ${prefix}status = 'ACCEPTED'
      AND ${prefix}client_attendance_confirmed_at IS NULL
      AND ${appointmentAt} >
        (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
      AND EXISTS (${activePushDevice})
      AND NOT EXISTS (${activeManualReminderJob})
      AND NOT (
        COALESCE(
          ${prefix}reminder_sent_at > NOW() - INTERVAL '15 minutes',
          FALSE
        )
        OR EXISTS (${recentManualReminder})
      )
    ) AS "canSendAttendanceReminder"`
      : ""}
  `;
}

async function getBookingEligibility(
  queryable,
  userId,
  date
) {
  const result = await queryable.query(
    `
      WITH candidate_windows AS (
        SELECT window_start::date AS window_start
        FROM generate_series(
          $2::date - INTERVAL '6 days',
          $2::date,
          INTERVAL '1 day'
        ) AS generated_window(window_start)
      ),
      window_counts AS (
        SELECT
          w.window_start,
          COUNT(a.id)::int AS active_count
        FROM candidate_windows w
        LEFT JOIN appointments a
          ON a.user_id = $1
          AND a.status IN ('PENDING', 'ACCEPTED')
          AND a.appointment_date BETWEEN
            w.window_start
            AND (w.window_start + INTERVAL '6 days')
        GROUP BY w.window_start
      )
      SELECT
        (
          SELECT COUNT(*)::int
          FROM appointments daily
          WHERE daily.user_id = $1
            AND daily.appointment_date = $2::date
            AND daily.status IN ('PENDING', 'ACCEPTED')
        ) AS "activeOnDate",
        COALESCE(MAX(active_count), 0)::int
          AS "activeInSevenDays"
      FROM window_counts
    `,
    [userId, date]
  );

  const counts = result.rows[0];
  const activeOnDate = counts.activeOnDate;
  const activeInSevenDays = counts.activeInSevenDays;

  return {
    allowed:
      activeOnDate < BOOKING_POLICY.maxActivePerDay &&
      activeInSevenDays < BOOKING_POLICY.maxActiveInSevenDays,
    reason:
      activeOnDate >= BOOKING_POLICY.maxActivePerDay
        ? "Ya tienes una cita activa para este día."
        : activeInSevenDays >= BOOKING_POLICY.maxActiveInSevenDays
          ? "Ya alcanzaste el máximo de dos citas activas dentro de cualquier período de siete días."
          : null,
    activeOnDate,
    activeInSevenDays,
  };
}

/*
 * Devuelve los horarios disponibles
 * para una fecha.
 */
async function getAvailability(
  date,
  userId
) {
  const cutoffResult = await db.query(`
    SELECT
      TO_CHAR(
        (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}') + INTERVAL '1 day',
        'YYYY-MM-DD HH24:MI:SS.US'
      ) AS cutoff
  `);

  const bookingCutoff =
    cutoffResult.rows[0].cutoff;

  const result = await db.query(
    `
      SELECT
        TO_CHAR(
          appointment_time,
          'HH24:MI'
        ) AS time

      FROM appointments

      WHERE appointment_date = $1

        AND status IN (
          'PENDING',
          'ACCEPTED'
        )
    `,
    [date]
  );

  const occupiedTimes = new Set(
    result.rows.map(
      (item) => item.time
    )
  );

  const times = AVAILABLE_TIMES.map(
    (time) => ({
      time,
      available:
        !occupiedTimes.has(time) &&
        `${date} ${time}:00.000000` >= bookingCutoff,
    })
  );

  let eligibility = {
    allowed: true,
    reason: null,
    activeOnDate: 0,
    activeInSevenDays: 0,
  };

  if (userId) {
    eligibility = await getBookingEligibility(
      db,
      userId,
      date
    );
  }

  return {
    times,
    eligibility,
    policy: BOOKING_POLICY,
  };
}

async function getNextAvailableDate(
  startDate,
  userId,
  searchDays = 60
) {
  const nextResult = await db.query(
    `
      WITH candidate_dates AS (
        SELECT candidate::date AS appointment_date
        FROM generate_series(
          $1::date,
          $1::date + ($2::int - 1) * INTERVAL '1 day',
          INTERVAL '1 day'
        ) AS candidate
      ),
      candidate_times AS (
        SELECT unnest($3::time[]) AS appointment_time
      )
      SELECT
        TO_CHAR(d.appointment_date, 'YYYY-MM-DD') AS date
      FROM candidate_dates d
      CROSS JOIN candidate_times t
      LEFT JOIN appointments a
        ON a.appointment_date = d.appointment_date
        AND a.appointment_time = t.appointment_time
        AND a.status IN ('PENDING', 'ACCEPTED')
      WHERE a.id IS NULL
        AND (d.appointment_date + t.appointment_time) >=
          (
            (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
            + INTERVAL '1 day'
          )

        AND NOT EXISTS (
          SELECT 1
          FROM appointments own_day
          WHERE own_day.user_id = $4
            AND own_day.appointment_date = d.appointment_date
            AND own_day.status IN ('PENDING', 'ACCEPTED')
        )

        AND NOT EXISTS (
          SELECT 1
          FROM generate_series(
            d.appointment_date - INTERVAL '6 days',
            d.appointment_date,
            INTERVAL '1 day'
          ) AS candidate_window(window_start)
          WHERE (
            SELECT COUNT(*)
            FROM appointments own_window
            WHERE own_window.user_id = $4
              AND own_window.status IN ('PENDING', 'ACCEPTED')
              AND own_window.appointment_date BETWEEN
                candidate_window.window_start::date
                AND (
                  candidate_window.window_start::date
                  + INTERVAL '6 days'
                )
          ) >= ${BOOKING_POLICY.maxActiveInSevenDays}
        )

      ORDER BY d.appointment_date, t.appointment_time
      LIMIT 1
    `,
    [startDate, searchDays, AVAILABLE_TIMES, userId]
  );

  if (nextResult.rows.length === 0) {
    return {
      date: null,
      times: [],
      eligibility: null,
      policy: BOOKING_POLICY,
    };
  }

  const date = nextResult.rows[0].date;
  const availability = await getAvailability(
    date,
    userId
  );

  return {
    date,
    ...availability,
  };
}

/*
 * Crea una nueva cita.
 *
 * Reglas:
 * - Máximo 1 cita activa por día.
 * - Máximo 2 citas activas dentro
 *   de un período móvil de 7 días.
 * - Solo PENDING y ACCEPTED
 *   cuentan como citas activas.
 */
async function createAppointment({
  userId,
  service,
  date,
  time,
}) {
  /*
   * Validar que la hora esté dentro
   * de los horarios permitidos.
   */
  if (
    !AVAILABLE_TIMES.includes(time)
  ) {
    const error = new Error(
      "El horario seleccionado no es válido."
    );

    error.statusCode = 400;

    throw error;
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Serializa las reservas de un mismo cliente. El índice parcial sigue
    // resolviendo la competencia entre clientes por el mismo horario.
    await client.query(
      "SELECT pg_advisory_xact_lock($1::bigint)",
      [userId]
    );

  const leadTimeResult =
    await client.query(
      `
        SELECT
          (
            $1::date + $2::time
          ) >= (
            (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
            + INTERVAL '1 day'
          ) AS allowed
      `,
      [date, time]
    );

  if (!leadTimeResult.rows[0].allowed) {
    const error = new Error(
      "Debes reservar con al menos 24 horas de anticipación."
    );

    error.statusCode = 400;

    throw error;
  }

  const bookingEligibility =
    await getBookingEligibility(
      client,
      userId,
      date
    );

  if (!bookingEligibility.allowed) {
    const error = new Error(
      bookingEligibility.reason ||
        "No puedes crear otra cita dentro de este período."
    );

    error.statusCode = 409;
    throw error;
  }

  /*
   * Verificar que el horario
   * siga disponible.
   */
  const existingResult =
    await client.query(
      `
        SELECT id

        FROM appointments

        WHERE appointment_date = $1

          AND appointment_time = $2

          AND status IN (
            'PENDING',
            'ACCEPTED'
          )

        LIMIT 1
      `,
      [
        date,
        time,
      ]
    );

  if (
    existingResult.rows.length > 0
  ) {
    const error = new Error(
      "Este horario ya no está disponible."
    );

    error.statusCode = 409;

    throw error;
  }

  try {
    const result =
      await client.query(
        `
          INSERT INTO appointments (
            user_id,
            service,
            appointment_date,
            appointment_time,
            status
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            'PENDING'
          )

          RETURNING
            id,

            user_id AS "userId",

            service,

            TO_CHAR(
              appointment_date,
              'YYYY-MM-DD'
            ) AS date,

            TO_CHAR(
              appointment_time,
              'HH24:MI'
            ) AS time,

            status,

            ${getAttendanceProjection()},

            created_at AS "createdAt"
        `,
        [
          userId,
          service,
          date,
          time,
        ]
      );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    /*
     * El índice único parcial
     * protege contra dos solicitudes
     * simultáneas para el mismo horario.
     */
    if (error.code === "23505") {
      const conflictError =
        new Error(
          "Este horario ya no está disponible."
        );

      conflictError.statusCode =
        409;

      throw conflictError;
    }

    throw error;
  }
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "ERROR REVERTIENDO RESERVA:",
        rollbackError
      );
    }
    throw error;
  } finally {
    client.release();
  }
}

/*
 * Devuelve todas las citas
 * de un cliente.
 */
async function getUserAppointments(
  userId,
  {
    page,
    pageSize,
    offset,
  }
) {
  const [result, countResult] = await Promise.all([
    db.query(
    `
      SELECT
        id,

        service,

        TO_CHAR(
          appointment_date,
          'YYYY-MM-DD'
        ) AS date,

        TO_CHAR(
          appointment_time,
          'HH24:MI'
        ) AS time,

        status,

        ${getAttendanceProjection()},

        created_at AS "createdAt",

        (
          (appointment_date + appointment_time)
          - INTERVAL '${BOOKING_POLICY.cancellationWindowMinutes} minutes'
        ) AT TIME ZONE '${BUSINESS_TIME_ZONE}'
          AS "cancelUntil",

        (
          status IN ('PENDING', 'ACCEPTED')
          AND (appointment_date + appointment_time) >= (
            (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
            + INTERVAL '${BOOKING_POLICY.cancellationWindowMinutes} minutes'
          )
        ) AS "canCancel",

        (
          appointment_date + appointment_time
        ) <= (
          NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}'
        ) AS "isPast"

      FROM appointments

      WHERE user_id = $1

      ORDER BY
        CASE
          WHEN status IN ('PENDING', 'ACCEPTED')
            AND (appointment_date + appointment_time) >
              (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
          THEN 0
          ELSE 1
        END ASC,

        CASE
          WHEN status IN ('PENDING', 'ACCEPTED')
            AND (appointment_date + appointment_time) >
              (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
          THEN appointment_date
        END ASC,

        CASE
          WHEN status IN ('PENDING', 'ACCEPTED')
            AND (appointment_date + appointment_time) >
              (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
          THEN appointment_time
        END ASC,

        appointment_date DESC,
        appointment_time DESC,
        created_at DESC

      LIMIT $2
      OFFSET $3
    `,
    [userId, pageSize, offset]
    ),
    db.query(
      `
        SELECT COUNT(*)::int AS total
        FROM appointments
        WHERE user_id = $1
      `,
      [userId]
    ),
  ]);

  return {
    appointments: result.rows,
    total: countResult.rows[0].total,
    page,
    pageSize,
  };
}

/*
 * Cancelación realizada
 * por el cliente.
 *
 * El cliente puede cancelar una cita PENDING o ACCEPTED
 * hasta una hora antes de su fecha y hora de inicio.
 * La comparación es inclusiva: exactamente 60 minutos
 * antes todavía se permite la cancelación.
 */
async function cancelAppointment(
  userId,
  appointmentId
) {
  const cancelResult = await db.query(
    `
      UPDATE appointments
      SET
        status = 'CANCELLED',
        reminder_claimed_at = NULL,
        reminder_claim_token = NULL
      WHERE id = $1
        AND user_id = $2
        AND status IN ('PENDING', 'ACCEPTED')
        AND (appointment_date + appointment_time) >= (
          (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
          + INTERVAL '${BOOKING_POLICY.cancellationWindowMinutes} minutes'
        )
      RETURNING
        id,
        user_id AS "userId",
        service,
        TO_CHAR(appointment_date, 'YYYY-MM-DD') AS date,
        TO_CHAR(appointment_time, 'HH24:MI') AS time,
        status,
        ${getAttendanceProjection()},
        created_at AS "createdAt",
        (
          (appointment_date + appointment_time)
          - INTERVAL '${BOOKING_POLICY.cancellationWindowMinutes} minutes'
        ) AT TIME ZONE '${BUSINESS_TIME_ZONE}' AS "cancelUntil",
        FALSE AS "canCancel"
    `,
    [appointmentId, userId]
  );

  if (cancelResult.rows.length > 0) {
    return cancelResult.rows[0];
  }

  const result = await db.query(
    `
      SELECT
        id,
        user_id,
        service,
        appointment_date,
        appointment_time,
        status,
        created_at,
        (appointment_date + appointment_time) >= (
          (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
          + INTERVAL '${BOOKING_POLICY.cancellationWindowMinutes} minutes'
        )
          AS "canCancel"

      FROM appointments

      WHERE id = $1
        AND user_id = $2

      LIMIT 1
    `,
    [
      appointmentId,
      userId,
    ]
  );

  const appointment =
    result.rows[0];

  if (!appointment) {
    const error = new Error(
      "La cita no existe o no pertenece a tu cuenta."
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    appointment.status ===
      "CANCELLED" ||
    appointment.status ===
      "REJECTED" ||
    appointment.status ===
      "COMPLETED"
  ) {
    const error = new Error(
      "Esta cita ya no puede cancelarse."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!appointment.canCancel) {
    const error = new Error(
      "Ya no se puede cancelar esta cita. Debes cancelarla al menos una hora antes de su inicio."
    );

    error.statusCode = 400;

    throw error;
  }

  const error = new Error(
    "La cita cambió mientras intentabas cancelarla. Actualiza e inténtalo nuevamente."
  );

  error.statusCode = 409;
  throw error;
}

/*
 * Registra de forma idempotente la confirmación de asistencia.
 * La mutación autoritativa incluye ownership, estado y tiempo para
 * evitar carreras con cancelaciones o cambios administrativos.
 */
async function confirmAppointmentAttendance(
  userId,
  appointmentId
) {
  const updateResult = await db.query(
    `
      UPDATE appointments
      SET
        client_attendance_confirmed_at = COALESCE(
          client_attendance_confirmed_at,
          NOW()
        ),
        reminder_claimed_at = NULL,
        reminder_claim_token = NULL
      WHERE id = $1
        AND user_id = $2
        AND status = 'ACCEPTED'
        AND (appointment_date + appointment_time) > (
          NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}'
        )
      RETURNING
        id,
        user_id AS "userId",
        service,
        TO_CHAR(appointment_date, 'YYYY-MM-DD') AS date,
        TO_CHAR(appointment_time, 'HH24:MI') AS time,
        status,
        ${getAttendanceProjection()},
        created_at AS "createdAt",
        (
          (appointment_date + appointment_time)
          - INTERVAL '${BOOKING_POLICY.cancellationWindowMinutes} minutes'
        ) AT TIME ZONE '${BUSINESS_TIME_ZONE}' AS "cancelUntil",
        (
          (appointment_date + appointment_time) >= (
            (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
            + INTERVAL '${BOOKING_POLICY.cancellationWindowMinutes} minutes'
          )
        ) AS "canCancel"
    `,
    [appointmentId, userId]
  );

  if (updateResult.rows.length > 0) {
    return updateResult.rows[0];
  }

  const result = await db.query(
    `
      SELECT
        id,
        user_id AS "userId",
        service,
        TO_CHAR(appointment_date, 'YYYY-MM-DD') AS date,
        TO_CHAR(appointment_time, 'HH24:MI') AS time,
        status,
        ${getAttendanceProjection()},
        created_at AS "createdAt",
        (
          (appointment_date + appointment_time)
          - INTERVAL '${BOOKING_POLICY.cancellationWindowMinutes} minutes'
        ) AT TIME ZONE '${BUSINESS_TIME_ZONE}' AS "cancelUntil",
        (
          status IN ('PENDING', 'ACCEPTED')
          AND (appointment_date + appointment_time) >= (
            (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
            + INTERVAL '${BOOKING_POLICY.cancellationWindowMinutes} minutes'
          )
        ) AS "canCancel",
        (
          (appointment_date + appointment_time) > (
            NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}'
          )
        ) AS "isFuture"
      FROM appointments
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [appointmentId, userId]
  );

  const appointment = result.rows[0];

  if (!appointment) {
    const error = new Error(
      "La cita no existe o no pertenece a tu cuenta."
    );
    error.statusCode = 404;
    throw error;
  }

  const {
    isFuture,
    ...publicAppointment
  } = appointment;

  if (
    appointment.clientAttendanceConfirmedAt &&
    (appointment.status === "ACCEPTED" ||
      appointment.status === "COMPLETED")
  ) {
    return publicAppointment;
  }

  if (appointment.status !== "ACCEPTED") {
    const error = new Error(
      "Solo puedes confirmar asistencia a una cita aceptada."
    );
    error.statusCode = 409;
    throw error;
  }

  if (!isFuture) {
    const error = new Error(
      "Ya no puedes confirmar asistencia porque la cita inició."
    );
    error.statusCode = 409;
    throw error;
  }

  const error = new Error(
    "La cita cambió mientras confirmabas tu asistencia. Actualiza e inténtalo nuevamente."
  );
  error.statusCode = 409;
  throw error;
}

function getAdminSearchCriteria(search) {
  const normalizedSearch = search.trim();
  const idMatch = normalizedSearch.match(/^#?(\d+)$/);
  let searchedId = null;

  if (idMatch) {
    const parsedId = BigInt(idMatch[1]);
    const maxPostgresBigInt = 9_223_372_036_854_775_807n;

    searchedId =
      parsedId > 0n && parsedId <= maxPostgresBigInt
        ? parsedId.toString()
        : "-1";
  }
  const textSearch = normalizedSearch.startsWith("#")
    ? ""
    : normalizedSearch;

  return {
    searchedId,
    textSearch,
  };
}

/*
 * Devuelve todas las citas
 * para administración.
 */
async function getAllAppointments({
  page,
  pageSize,
  offset,
  status = null,
  search = "",
  upcomingOnly = false,
}) {
  const {
    searchedId,
    textSearch,
  } = getAdminSearchCriteria(search);

  const [
    result,
    countResult,
    statusCountResult,
  ] = await Promise.all([
    db.query(
    `
      SELECT
        a.id,

        a.service,

        TO_CHAR(
          a.appointment_date,
          'YYYY-MM-DD'
        ) AS date,

        TO_CHAR(
          a.appointment_time,
          'HH24:MI'
        ) AS time,

        a.status,

        ${getAttendanceProjection("a", {
          includeReminderSentAt: true,
          includeManualReminderState: true,
        })},

        (
          a.appointment_date + a.appointment_time
        ) <= (
          NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}'
        ) AS "canComplete",

        (
          a.appointment_date + a.appointment_time
        ) > (
          NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}'
        ) AS "canAdminCancel",

        (
          a.status = 'PENDING'
          AND (a.appointment_date + a.appointment_time) >
            (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
        ) AS "canAccept",

        (
          (a.appointment_date + a.appointment_time) <=
            (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
        ) AS "isPast",

        a.created_at
          AS "createdAt",

        u.id
          AS "userId",

        u.first_name
          AS "firstName",

        u.last_name
          AS "lastName",

        u.phone

      FROM appointments a

      INNER JOIN users u
        ON a.user_id = u.id

      WHERE ($1::text IS NULL OR a.status = $1)
        AND (
          ($2::bigint IS NOT NULL AND a.id = $2::bigint)
          OR (
            $3::text <> ''
            AND CONCAT_WS(
              ' ',
              u.first_name,
              u.last_name,
              u.phone,
              a.service,
              TO_CHAR(a.appointment_date, 'YYYY-MM-DD'),
              TO_CHAR(a.appointment_time, 'HH24:MI')
            ) ILIKE '%' || $3 || '%'
          )
          OR ($2::bigint IS NULL AND $3::text = '')
        )
        AND (
          $4::boolean = FALSE
          OR (
            a.status IN ('PENDING', 'ACCEPTED')
            AND (a.appointment_date + a.appointment_time) >
              (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
          )
        )

      ORDER BY
        CASE
          WHEN a.status IN ('PENDING', 'ACCEPTED') THEN 0
          ELSE 1
        END ASC,

        CASE
          WHEN a.status IN ('PENDING', 'ACCEPTED')
          THEN a.appointment_date
        END ASC,

        CASE
          WHEN a.status IN ('PENDING', 'ACCEPTED')
          THEN a.appointment_time
        END ASC,

        a.appointment_date DESC,
        a.appointment_time DESC,
        a.created_at DESC

      LIMIT $5
      OFFSET $6
    `,
    [
      status,
      searchedId,
      textSearch,
      upcomingOnly,
      pageSize,
      offset,
    ]
    ),
    db.query(
      `
        SELECT COUNT(*)::int AS total
        FROM appointments a
        INNER JOIN users u ON a.user_id = u.id
        WHERE ($1::text IS NULL OR a.status = $1)
          AND (
            ($2::bigint IS NOT NULL AND a.id = $2::bigint)
            OR (
              $3::text <> ''
              AND CONCAT_WS(
                ' ',
                u.first_name,
                u.last_name,
                u.phone,
                a.service,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD'),
                TO_CHAR(a.appointment_time, 'HH24:MI')
              ) ILIKE '%' || $3 || '%'
            )
            OR ($2::bigint IS NULL AND $3::text = '')
          )
          AND (
            $4::boolean = FALSE
            OR (
              a.status IN ('PENDING', 'ACCEPTED')
              AND (a.appointment_date + a.appointment_time) >
                (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
            )
          )
      `,
      [status, searchedId, textSearch, upcomingOnly]
    ),
    db.query(
      `
        SELECT
          a.status,
          COUNT(*)::int AS count
        FROM appointments a
        INNER JOIN users u ON a.user_id = u.id
        WHERE (
          ($1::bigint IS NOT NULL AND a.id = $1::bigint)
          OR (
            $2::text <> ''
            AND CONCAT_WS(
              ' ',
              u.first_name,
              u.last_name,
              u.phone,
              a.service,
              TO_CHAR(a.appointment_date, 'YYYY-MM-DD'),
              TO_CHAR(a.appointment_time, 'HH24:MI')
            ) ILIKE '%' || $2 || '%'
          )
          OR ($1::bigint IS NULL AND $2::text = '')
        )
        AND (
          $3::boolean = FALSE
          OR (
            a.status IN ('PENDING', 'ACCEPTED')
            AND (a.appointment_date + a.appointment_time) >
              (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
          )
        )
        GROUP BY a.status
      `,
      [searchedId, textSearch, upcomingOnly]
    ),
  ]);

  return {
    appointments: result.rows,
    total: countResult.rows[0].total,
    page,
    pageSize,
    statusCounts: Object.fromEntries(
      statusCountResult.rows.map(
        (item) => [item.status, item.count]
      )
    ),
  };
}

/*
 * Acepta una cita pendiente.
 */
async function acceptAppointment(
  appointmentId
) {
  const result = await db.query(
    `
      SELECT
        id,
        status,

        (
          appointment_date + appointment_time
        ) > (
          NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}'
        ) AS "isFuture"

      FROM appointments

      WHERE id = $1

      LIMIT 1
    `,
    [appointmentId]
  );

  const appointment =
    result.rows[0];

  if (!appointment) {
    const error = new Error(
      "La cita no existe."
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    appointment.status !==
    "PENDING"
  ) {
    const error = new Error(
      "Solo las citas pendientes pueden aceptarse."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!appointment.isFuture) {
    const error = new Error(
      "Esta solicitud venció porque la hora de la cita ya pasó."
    );

    error.statusCode = 409;

    throw error;
  }

  const updateResult =
    await db.query(
      `
        UPDATE appointments

        SET status = 'ACCEPTED'

        WHERE id = $1
          AND status = 'PENDING'

          AND (
            appointment_date + appointment_time
          ) > (
            NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}'
          )

        RETURNING
          id,

          user_id AS "userId",

          service,

          TO_CHAR(
            appointment_date,
            'YYYY-MM-DD'
          ) AS date,

          TO_CHAR(
            appointment_time,
            'HH24:MI'
          ) AS time,

          status,

          ${getAttendanceProjection("", {
            includeReminderSentAt: true,
            includeManualReminderState: true,
          })},

          created_at AS "createdAt"
      `,
      [appointmentId]
    );

  if (
    updateResult.rows.length === 0
  ) {
    const error = new Error(
      "La cita ya fue procesada."
    );

    error.statusCode = 409;

    throw error;
  }

  return updateResult.rows[0];
}

/*
 * Rechaza una cita pendiente.
 */
async function rejectAppointment(
  appointmentId
) {
  const result = await db.query(
    `
      SELECT
        id,
        status

      FROM appointments

      WHERE id = $1

      LIMIT 1
    `,
    [appointmentId]
  );

  const appointment =
    result.rows[0];

  if (!appointment) {
    const error = new Error(
      "La cita no existe."
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    appointment.status !==
    "PENDING"
  ) {
    const error = new Error(
      "Solo las citas pendientes pueden rechazarse."
    );

    error.statusCode = 400;

    throw error;
  }

  const updateResult =
    await db.query(
      `
        UPDATE appointments

        SET
          status = 'REJECTED',
          reminder_claimed_at = NULL,
          reminder_claim_token = NULL

        WHERE id = $1
          AND status = 'PENDING'

        RETURNING
          id,

          user_id AS "userId",

          service,

          TO_CHAR(
            appointment_date,
            'YYYY-MM-DD'
          ) AS date,

          TO_CHAR(
            appointment_time,
            'HH24:MI'
          ) AS time,

          status,

          ${getAttendanceProjection("", {
            includeReminderSentAt: true,
            includeManualReminderState: true,
          })},

          created_at AS "createdAt"
      `,
      [appointmentId]
    );

  if (
    updateResult.rows.length === 0
  ) {
    const error = new Error(
      "La cita ya fue procesada."
    );

    error.statusCode = 409;

    throw error;
  }

  return updateResult.rows[0];
}

/*
 * Consulta la agenda
 * por rango de fechas.
 */
async function getAppointmentsByDateRange(
  startDate,
  endDate,
  {
    page,
    pageSize,
    offset,
    status = null,
    search = "",
    upcomingOnly = false,
  }
) {
  const {
    searchedId,
    textSearch,
  } = getAdminSearchCriteria(search);

  const [
    result,
    countResult,
    statusCountResult,
  ] = await Promise.all([
    db.query(
    `
      SELECT
        a.id,

        a.service,

        TO_CHAR(
          a.appointment_date,
          'YYYY-MM-DD'
        ) AS date,

        TO_CHAR(
          a.appointment_time,
          'HH24:MI'
        ) AS time,

        a.status,

        ${getAttendanceProjection("a", {
          includeReminderSentAt: true,
          includeManualReminderState: true,
        })},

        (
          a.appointment_date + a.appointment_time
        ) <= (
          NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}'
        ) AS "canComplete",

        (
          a.appointment_date + a.appointment_time
        ) > (
          NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}'
        ) AS "canAdminCancel",

        (
          a.status = 'PENDING'
          AND (a.appointment_date + a.appointment_time) >
            (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
        ) AS "canAccept",

        (
          (a.appointment_date + a.appointment_time) <=
            (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
        ) AS "isPast",

        a.created_at
          AS "createdAt",

        u.id
          AS "userId",

        u.first_name
          AS "firstName",

        u.last_name
          AS "lastName",

        u.phone

      FROM appointments a

      INNER JOIN users u
        ON a.user_id = u.id

      WHERE a.appointment_date
        BETWEEN $1 AND $2

        AND ($3::text IS NULL OR a.status = $3)

        AND (
          ($4::bigint IS NOT NULL AND a.id = $4::bigint)
          OR (
            $5::text <> ''
            AND CONCAT_WS(
              ' ',
              u.first_name,
              u.last_name,
              u.phone,
              a.service,
              TO_CHAR(a.appointment_date, 'YYYY-MM-DD'),
              TO_CHAR(a.appointment_time, 'HH24:MI')
            ) ILIKE '%' || $5 || '%'
          )
          OR ($4::bigint IS NULL AND $5::text = '')
        )

        AND (
          $6::boolean = FALSE
          OR (
            a.status IN ('PENDING', 'ACCEPTED')
            AND (a.appointment_date + a.appointment_time) >
              (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
          )
        )

      ORDER BY
        a.appointment_date ASC,
        a.appointment_time ASC,
        a.created_at ASC

      LIMIT $7
      OFFSET $8
    `,
    [
      startDate,
      endDate,
      status,
      searchedId,
      textSearch,
      upcomingOnly,
      pageSize,
      offset,
    ]
    ),
    db.query(
      `
        SELECT COUNT(*)::int AS total
        FROM appointments a
        INNER JOIN users u ON a.user_id = u.id
        WHERE a.appointment_date BETWEEN $1 AND $2
          AND ($3::text IS NULL OR a.status = $3)
          AND (
            ($4::bigint IS NOT NULL AND a.id = $4::bigint)
            OR (
              $5::text <> ''
              AND CONCAT_WS(
                ' ',
                u.first_name,
                u.last_name,
                u.phone,
                a.service,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD'),
                TO_CHAR(a.appointment_time, 'HH24:MI')
              ) ILIKE '%' || $5 || '%'
            )
            OR ($4::bigint IS NULL AND $5::text = '')
          )
          AND (
            $6::boolean = FALSE
            OR (
              a.status IN ('PENDING', 'ACCEPTED')
              AND (a.appointment_date + a.appointment_time) >
                (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
            )
          )
      `,
      [
        startDate,
        endDate,
        status,
        searchedId,
        textSearch,
        upcomingOnly,
      ]
    ),
    db.query(
      `
        SELECT
          a.status,
          COUNT(*)::int AS count
        FROM appointments a
        INNER JOIN users u ON a.user_id = u.id
        WHERE a.appointment_date BETWEEN $1 AND $2
          AND (
            ($3::bigint IS NOT NULL AND a.id = $3::bigint)
            OR (
              $4::text <> ''
              AND CONCAT_WS(
                ' ',
                u.first_name,
                u.last_name,
                u.phone,
                a.service,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD'),
                TO_CHAR(a.appointment_time, 'HH24:MI')
              ) ILIKE '%' || $4 || '%'
            )
            OR ($3::bigint IS NULL AND $4::text = '')
          )
          AND (
            $5::boolean = FALSE
            OR (
              a.status IN ('PENDING', 'ACCEPTED')
              AND (a.appointment_date + a.appointment_time) >
                (NOW() AT TIME ZONE '${BUSINESS_TIME_ZONE}')
            )
          )
        GROUP BY a.status
      `,
      [
        startDate,
        endDate,
        searchedId,
        textSearch,
        upcomingOnly,
      ]
    ),
  ]);

  return {
    appointments: result.rows,
    total: countResult.rows[0].total,
    page,
    pageSize,
    statusCounts: Object.fromEntries(
      statusCountResult.rows.map(
        (item) => [item.status, item.count]
      )
    ),
  };
}

/*
 * Cancelación administrativa.
 *
 * Solo se permite cancelar una cita
 * ACCEPTED cuya hora todavía
 * no haya llegado.
 */
async function cancelAppointmentByAdmin(
  appointmentId
) {
  const result = await db.query(
    `
      SELECT
        id,

        status,

        (
          appointment_date +
          appointment_time
        ) >
        (
          NOW()
          AT TIME ZONE
          '${BUSINESS_TIME_ZONE}'
        )
        AS "isFuture"

      FROM appointments

      WHERE id = $1

      LIMIT 1
    `,
    [appointmentId]
  );

  const appointment =
    result.rows[0];

  if (!appointment) {
    const error = new Error(
      "La cita no existe."
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    appointment.status !==
    "ACCEPTED"
  ) {
    const error = new Error(
      "Solo las citas aceptadas pueden cancelarse administrativamente."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!appointment.isFuture) {
    const error = new Error(
      "No se puede cancelar administrativamente una cita cuya hora ya pasó."
    );

    error.statusCode = 400;

    throw error;
  }

  const updateResult =
    await db.query(
      `
        UPDATE appointments

        SET
          status = 'CANCELLED',
          reminder_claimed_at = NULL,
          reminder_claim_token = NULL

        WHERE id = $1

          AND status = 'ACCEPTED'

          AND (
            appointment_date +
            appointment_time
          ) >
          (
            NOW()
            AT TIME ZONE
            '${BUSINESS_TIME_ZONE}'
          )

        RETURNING
          id,

          user_id AS "userId",

          service,

          TO_CHAR(
            appointment_date,
            'YYYY-MM-DD'
          ) AS date,

          TO_CHAR(
            appointment_time,
            'HH24:MI'
          ) AS time,

          status,

          ${getAttendanceProjection("", {
            includeReminderSentAt: true,
            includeManualReminderState: true,
          })},

          created_at AS "createdAt"
      `,
      [appointmentId]
    );

  if (
    updateResult.rows.length === 0
  ) {
    const error = new Error(
      "La cita cambió de estado o su hora ya pasó."
    );

    error.statusCode = 409;

    throw error;
  }

  return updateResult.rows[0];
}

/*
 * Marca una cita como completada.
 *
 * Solo puede completarse si:
 * - está ACCEPTED;
 * - su fecha/hora ya llegó o pasó.
 */
async function completeAppointment(
  appointmentId
) {
  const result = await db.query(
    `
      SELECT
        id,

        status,

        (
          appointment_date +
          appointment_time
        ) <=
        (
          NOW()
          AT TIME ZONE
          '${BUSINESS_TIME_ZONE}'
        )
        AS "canComplete"

      FROM appointments

      WHERE id = $1

      LIMIT 1
    `,
    [appointmentId]
  );

  const appointment =
    result.rows[0];

  if (!appointment) {
    const error = new Error(
      "La cita no existe."
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    appointment.status !==
    "ACCEPTED"
  ) {
    const error = new Error(
      "Solo las citas confirmadas pueden marcarse como completadas."
    );

    error.statusCode = 400;

    throw error;
  }

  if (
    !appointment.canComplete
  ) {
    const error = new Error(
      "No puedes completar una cita antes de su hora programada."
    );

    error.statusCode = 400;

    throw error;
  }

  const updateResult =
    await db.query(
      `
        UPDATE appointments

        SET
          status = 'COMPLETED',
          reminder_claimed_at = NULL,
          reminder_claim_token = NULL

        WHERE id = $1

          AND status = 'ACCEPTED'

          AND (
            appointment_date +
            appointment_time
          ) <=
          (
            NOW()
            AT TIME ZONE
            '${BUSINESS_TIME_ZONE}'
          )

        RETURNING
          id,

          user_id AS "userId",

          service,

          TO_CHAR(
            appointment_date,
            'YYYY-MM-DD'
          ) AS date,

          TO_CHAR(
            appointment_time,
            'HH24:MI'
          ) AS time,

          status,

          ${getAttendanceProjection("", {
            includeReminderSentAt: true,
            includeManualReminderState: true,
          })},

          created_at AS "createdAt"
      `,
      [appointmentId]
    );

  if (
    updateResult.rows.length === 0
  ) {
    const error = new Error(
      "La cita cambió de estado y no pudo completarse."
    );

    error.statusCode = 409;

    throw error;
  }

  return updateResult.rows[0];
}

module.exports = {
  BOOKING_POLICY,
  getAdminSearchCriteria,
  getAvailability,
  getNextAvailableDate,
  createAppointment,
  getUserAppointments,
  cancelAppointment,
  confirmAppointmentAttendance,
  getAllAppointments,
  getAppointmentsByDateRange,
  acceptAppointment,
  rejectAppointment,
  cancelAppointmentByAdmin,
  completeAppointment,
};
