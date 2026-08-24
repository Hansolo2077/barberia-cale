const adminReminderService = require(
  "../services/admin-reminder.service"
);

const {
  sendControllerError,
} = require("../utils/http-error");

function getPolicy() {
  return {
    cooldownMinutes:
      adminReminderService
        .MANUAL_REMINDER_COOLDOWN_MINUTES,
    bulkLimit:
      adminReminderService
        .MAX_BULK_REMINDERS,
  };
}

async function getAttendanceReminderSummary(
  req,
  res
) {
  try {
    const summary = await adminReminderService
      .getAttendanceReminderSummary();

    return res.json({
      success: true,
      summary,
      policy: getPolicy(),
    });
  } catch (error) {
    console.error(
      "ERROR CONSULTANDO RECORDATORIOS ADMIN:",
      error
    );

    return sendControllerError(
      res,
      error,
      "No se pudo consultar el estado de los recordatorios."
    );
  }
}

async function queueAttendanceReminders(
  req,
  res
) {
  try {
    const summary = await adminReminderService
      .queueAttendanceReminders(
        req.user.userId
      );

    const message = summary.queued > 0
      ? summary.queued === 1
        ? "Se programó 1 recordatorio de asistencia."
        : `Se programaron ${summary.queued} recordatorios de asistencia.`
      : "No hay citas que puedan recibir un recordatorio en este momento.";

    return res.status(202).json({
      success: true,
      message,
      summary,
      policy: getPolicy(),
    });
  } catch (error) {
    console.error(
      "ERROR PROGRAMANDO RECORDATORIOS ADMIN:",
      error
    );

    return sendControllerError(
      res,
      error,
      "No se pudieron programar los recordatorios."
    );
  }
}

async function queueAppointmentAttendanceReminder(
  req,
  res
) {
  try {
    const appointmentId = Number(
      req.params.id
    );

    if (
      !Number.isSafeInteger(appointmentId) ||
      appointmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identificador de cita inválido.",
      });
    }

    const reminder = await adminReminderService
      .queueAppointmentAttendanceReminder(
        appointmentId,
        req.user.userId
      );

    return res.status(202).json({
      success: true,
      message:
        "El recordatorio de asistencia quedó programado.",
      reminder,
      policy: getPolicy(),
    });
  } catch (error) {
    console.error(
      "ERROR PROGRAMANDO RECORDATORIO DE CITA:",
      error
    );

    return sendControllerError(
      res,
      error,
      "No se pudo programar el recordatorio."
    );
  }
}

module.exports = {
  getAttendanceReminderSummary,
  queueAttendanceReminders,
  queueAppointmentAttendanceReminder,
};
