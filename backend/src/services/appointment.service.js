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

function getAvailability(date) {
  const occupied = db
    .prepare(`
      SELECT appointment_time
      FROM appointments
      WHERE appointment_date = ?
        AND status IN ('PENDING', 'ACCEPTED')
    `)
    .all(date);

  const occupiedTimes = new Set(
    occupied.map(
      (item) => item.appointment_time
    )
  );

  return AVAILABLE_TIMES.map(
    (time) => ({
      time,
      available:
        !occupiedTimes.has(time),
    })
  );
}

function createAppointment({
  userId,
  service,
  date,
  time,
}) {
  if (
    !AVAILABLE_TIMES.includes(time)
  ) {
    const error = new Error(
      "El horario seleccionado no es válido."
    );

    error.statusCode = 400;
    throw error;
  }

  const existingAppointment = db
    .prepare(`
      SELECT id
      FROM appointments
      WHERE appointment_date = ?
        AND appointment_time = ?
        AND status IN ('PENDING', 'ACCEPTED')
    `)
    .get(
      date,
      time
    );

  if (existingAppointment) {
    const error = new Error(
      "Este horario ya no está disponible."
    );

    error.statusCode = 409;
    throw error;
  }

  const result = db
    .prepare(`
      INSERT INTO appointments (
        user_id,
        service,
        appointment_date,
        appointment_time,
        status
      )
      VALUES (?, ?, ?, ?, 'PENDING')
    `)
    .run(
      userId,
      service,
      date,
      time
    );

  return {
    id: result.lastInsertRowid,
    userId,
    service,
    date,
    time,
    status: "PENDING",
  };
}

function getUserAppointments(
  userId
) {
  return db
    .prepare(`
      SELECT
        id,
        service,
        appointment_date AS date,
        appointment_time AS time,
        status,
        created_at AS createdAt
      FROM appointments
      WHERE user_id = ?
      ORDER BY
        appointment_date DESC,
        appointment_time DESC
    `)
    .all(userId);
}

function cancelAppointment(
  userId,
  appointmentId
) {
  const appointment = db
    .prepare(`
      SELECT *
      FROM appointments
      WHERE id = ?
        AND user_id = ?
    `)
    .get(
      appointmentId,
      userId
    );

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

  const createdAt = new Date(
    appointment.created_at + " UTC"
  );

  const now = new Date();

  const elapsedMilliseconds =
    now.getTime() -
    createdAt.getTime();

  const oneHour =
    60 * 60 * 1000;

  if (
    elapsedMilliseconds > oneHour
  ) {
    const error = new Error(
      "El plazo de una hora para cancelar esta cita ha finalizado."
    );

    error.statusCode = 400;
    throw error;
  }

  db.prepare(`
    UPDATE appointments
    SET status = 'CANCELLED'
    WHERE id = ?
  `).run(appointmentId);

  return {
    ...appointment,
    status: "CANCELLED",
  };
}

function getAllAppointments() {
  return db
    .prepare(`
      SELECT
        a.id,
        a.service,
        a.appointment_date AS date,
        a.appointment_time AS time,
        a.status,
        a.created_at AS createdAt,

        u.id AS userId,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.phone

      FROM appointments a

      INNER JOIN users u
        ON a.user_id = u.id

      ORDER BY
        a.appointment_date DESC,
        a.appointment_time DESC
    `)
    .all();
}

function acceptAppointment(
  appointmentId
) {
  const appointment = db
    .prepare(`
      SELECT *
      FROM appointments
      WHERE id = ?
    `)
    .get(appointmentId);

  if (!appointment) {
    const error = new Error(
      "La cita no existe."
    );

    error.statusCode = 404;
    throw error;
  }

  if (
    appointment.status !== "PENDING"
  ) {
    const error = new Error(
      "Solo las citas pendientes pueden aceptarse."
    );

    error.statusCode = 400;
    throw error;
  }

  db.prepare(`
    UPDATE appointments
    SET status = 'ACCEPTED'
    WHERE id = ?
  `).run(appointmentId);

  return {
    ...appointment,
    status: "ACCEPTED",
  };
}

function rejectAppointment(
  appointmentId
) {
  const appointment = db
    .prepare(`
      SELECT *
      FROM appointments
      WHERE id = ?
    `)
    .get(appointmentId);

  if (!appointment) {
    const error = new Error(
      "La cita no existe."
    );

    error.statusCode = 404;
    throw error;
  }

  if (
    appointment.status !== "PENDING"
  ) {
    const error = new Error(
      "Solo las citas pendientes pueden rechazarse."
    );

    error.statusCode = 400;
    throw error;
  }

  db.prepare(`
    UPDATE appointments
    SET status = 'REJECTED'
    WHERE id = ?
  `).run(appointmentId);

  return {
    ...appointment,
    status: "REJECTED",
  };
}

function getAppointmentsByDateRange(
  startDate,
  endDate
) {
  return db
    .prepare(`
      SELECT
        a.id,
        a.service,
        a.appointment_date AS date,
        a.appointment_time AS time,
        a.status,
        a.created_at AS createdAt,

        u.id AS userId,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.phone

      FROM appointments a

      INNER JOIN users u
        ON a.user_id = u.id

      WHERE a.appointment_date
        BETWEEN ? AND ?

      ORDER BY
        a.appointment_date ASC,
        a.appointment_time ASC
    `)
    .all(
      startDate,
      endDate
    );
}

function cancelAppointmentByAdmin(
  appointmentId
) {
  const appointment = db
    .prepare(`
      SELECT *
      FROM appointments
      WHERE id = ?
    `)
    .get(appointmentId);

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

  const [
    year,
    month,
    day,
  ] =
    appointment.appointment_date
      .split("-")
      .map(Number);

  const [
    hour,
    minute,
  ] =
    appointment.appointment_time
      .split(":")
      .map(Number);

  const appointmentDateTime =
    new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0
    );

  const now = new Date();

  if (
    appointmentDateTime.getTime() <=
    now.getTime()
  ) {
    const error = new Error(
      "No se puede cancelar administrativamente una cita cuya hora ya pasó."
    );

    error.statusCode = 400;
    throw error;
  }

  db.prepare(`
    UPDATE appointments
    SET status = 'CANCELLED'
    WHERE id = ?
  `).run(appointmentId);

  return {
    ...appointment,
    status: "CANCELLED",
  };
}

function completeAppointment(
  appointmentId
) {
  const appointment = db
    .prepare(`
      SELECT *
      FROM appointments
      WHERE id = ?
    `)
    .get(appointmentId);

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

  const [
    year,
    month,
    day,
  ] =
    appointment.appointment_date
      .split("-")
      .map(Number);

  const [
    hour,
    minute,
  ] =
    appointment.appointment_time
      .split(":")
      .map(Number);

  const appointmentDateTime =
    new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0
    );

  const now = new Date();

  if (
    appointmentDateTime.getTime() >
    now.getTime()
  ) {
    const error = new Error(
      "No puedes completar una cita antes de su hora programada."
    );

    error.statusCode = 400;
    throw error;
  }

  db.prepare(`
    UPDATE appointments
    SET status = 'COMPLETED'
    WHERE id = ?
  `).run(appointmentId);

  return {
    ...appointment,
    status: "COMPLETED",
  };
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