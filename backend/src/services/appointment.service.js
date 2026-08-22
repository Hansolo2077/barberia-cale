const db = require("../database/db");

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

/*
 * Devuelve los horarios disponibles
 * para una fecha.
 */
async function getAvailability(date) {
  const cutoffResult = await db.query(`
    SELECT
      TO_CHAR(
        (NOW() AT TIME ZONE 'America/Managua') + INTERVAL '1 day',
        'YYYY-MM-DD HH24:MI'
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

  return AVAILABLE_TIMES.map(
    (time) => ({
      time,
      available:
        !occupiedTimes.has(time) &&
        `${date} ${time}` >= bookingCutoff,
    })
  );
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

  const leadTimeResult =
    await db.query(
      `
        SELECT
          (
            $1::date + $2::time
          ) >= (
            (NOW() AT TIME ZONE 'America/Managua')
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

  /*
   * Máximo 1 cita activa
   * por día.
   */
  const dailyResult =
    await db.query(
      `
        SELECT
          COUNT(*)::int AS count

        FROM appointments

        WHERE user_id = $1

          AND appointment_date = $2

          AND status IN (
            'PENDING',
            'ACCEPTED'
          )
      `,
      [
        userId,
        date,
      ]
    );

  const dailyCount =
    dailyResult.rows[0].count;

  if (dailyCount >= 1) {
    const error = new Error(
      "Solo puedes tener una cita activa por día."
    );

    error.statusCode = 409;

    throw error;
  }

  /*
   * Máximo 2 citas activas
   * dentro de una ventana móvil
   * de 7 días.
   *
   * Ejemplo:
   * Si la nueva cita es para el día 21,
   * se revisan los días 15 al 21,
   * ambos incluidos.
   */
  const sevenDayResult =
    await db.query(
      `
        SELECT
          COUNT(*)::int AS count

        FROM appointments

        WHERE user_id = $1

          AND status IN (
            'PENDING',
            'ACCEPTED'
          )

          AND appointment_date
            BETWEEN
              (
                $2::date
                - INTERVAL '6 days'
              )
              AND
              $2::date
      `,
      [
        userId,
        date,
      ]
    );

  const sevenDayCount =
    sevenDayResult.rows[0].count;

  if (sevenDayCount >= 2) {
    const error = new Error(
      "Solo puedes tener un máximo de dos citas activas dentro de un período de 7 días."
    );

    error.statusCode = 409;

    throw error;
  }

  /*
   * Verificar que el horario
   * siga disponible.
   */
  const existingResult =
    await db.query(
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
      await db.query(
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

            created_at AS "createdAt"
        `,
        [
          userId,
          service,
          date,
          time,
        ]
      );

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
}

/*
 * Devuelve todas las citas
 * de un cliente.
 */
async function getUserAppointments(
  userId
) {
  const result = await db.query(
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

        created_at AS "createdAt",

        (
          status IN ('PENDING', 'ACCEPTED')
          AND created_at >= NOW() - INTERVAL '1 hour'
        ) AS "canCancel"

      FROM appointments

      WHERE user_id = $1

      ORDER BY
        appointment_date DESC,
        appointment_time DESC
    `,
    [userId]
  );

  return result.rows;
}

/*
 * Cancelación realizada
 * por el cliente.
 *
 * El cliente solo dispone de una hora
 * desde que creó la cita.
 */
async function cancelAppointment(
  userId,
  appointmentId
) {
  const result = await db.query(
    `
      SELECT
        id,
        user_id,
        service,
        appointment_date,
        appointment_time,
        status,
        created_at

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

  const createdAt =
    new Date(
      appointment.created_at
    );

  const now =
    new Date();

  const elapsedMilliseconds =
    now.getTime() -
    createdAt.getTime();

  const oneHour =
    60 * 60 * 1000;

  if (
    elapsedMilliseconds >
    oneHour
  ) {
    const error = new Error(
      "Ya no se puede cancelar esta cita. El plazo de cancelación expiró."
    );

    error.statusCode = 400;

    throw error;
  }

  const updateResult =
    await db.query(
      `
        UPDATE appointments

        SET status = 'CANCELLED'

        WHERE id = $1

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

          created_at AS "createdAt"
      `,
      [appointmentId]
    );

  return updateResult.rows[0];
}

/*
 * Devuelve todas las citas
 * para administración.
 */
async function getAllAppointments() {
  const result = await db.query(
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

        (
          a.appointment_date + a.appointment_time
        ) <= (
          NOW() AT TIME ZONE 'America/Managua'
        ) AS "canComplete",

        (
          a.appointment_date + a.appointment_time
        ) > (
          NOW() AT TIME ZONE 'America/Managua'
        ) AS "canAdminCancel",

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

      ORDER BY
        a.appointment_date DESC,
        a.appointment_time DESC
    `
  );

  return result.rows;
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
      "Solo las citas pendientes pueden aceptarse."
    );

    error.statusCode = 400;

    throw error;
  }

  const updateResult =
    await db.query(
      `
        UPDATE appointments

        SET status = 'ACCEPTED'

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

        SET status = 'REJECTED'

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
  endDate
) {
  const result = await db.query(
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

      ORDER BY
        a.appointment_date ASC,
        a.appointment_time ASC
    `,
    [
      startDate,
      endDate,
    ]
  );

  return result.rows;
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
          'America/Managua'
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

        SET status = 'CANCELLED'

        WHERE id = $1

          AND status = 'ACCEPTED'

          AND (
            appointment_date +
            appointment_time
          ) >
          (
            NOW()
            AT TIME ZONE
            'America/Managua'
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
          'America/Managua'
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

        SET status = 'COMPLETED'

        WHERE id = $1

          AND status = 'ACCEPTED'

          AND (
            appointment_date +
            appointment_time
          ) <=
          (
            NOW()
            AT TIME ZONE
            'America/Managua'
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
  getAvailability,
  createAppointment,
  getUserAppointments,
  cancelAppointment,
  getAllAppointments,
  getAppointmentsByDateRange,
  acceptAppointment,
  rejectAppointment,
  cancelAppointmentByAdmin,
  completeAppointment,
};
