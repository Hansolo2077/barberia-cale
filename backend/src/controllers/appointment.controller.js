const appointmentService =
  require("../services/appointment.service");

function isValidDateFormat(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(
    tomorrow.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    tomorrow.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function availability(req, res) {
  try {
    const { date } = req.query;

    if (!date || !isValidDateFormat(date)) {
      return res.status(400).json({
        success: false,
        message:
          "Debes proporcionar una fecha válida.",
      });
    }

    const minimumDate = getTomorrowDate();

    if (date < minimumDate) {
      return res.status(400).json({
        success: false,
        message:
          "Las citas deben agendarse al menos con un día de anticipación.",
      });
    }

    const times =
      appointmentService.getAvailability(date);

    return res.json({
      success: true,
      date,
      times,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "No se pudo consultar la disponibilidad.",
    });
  }
}

function create(req, res) {
  try {
    const {
      service,
      date,
      time,
    } = req.body;

    if (!service || !date || !time) {
      return res.status(400).json({
        success: false,
        message:
          "Servicio, fecha y hora son obligatorios.",
      });
    }

    if (!isValidDateFormat(date)) {
      return res.status(400).json({
        success: false,
        message: "La fecha no es válida.",
      });
    }

    const minimumDate = getTomorrowDate();

    if (date < minimumDate) {
      return res.status(400).json({
        success: false,
        message:
          "Las citas deben agendarse al menos con un día de anticipación.",
      });
    }

    const appointment =
      appointmentService.createAppointment({
        userId: req.user.userId,
        service,
        date,
        time,
      });

    return res.status(201).json({
      success: true,
      message:
        "Cita solicitada correctamente.",
      appointment,
    });
  } catch (error) {
    console.error(error);

    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.message ||
          "No se pudo crear la cita.",
      });
  }
}

function myAppointments(req, res) {
  try {
    const appointments =
      appointmentService.getUserAppointments(
        req.user.userId
      );

    return res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "No se pudieron consultar tus citas.",
    });
  }
}

function cancel(req, res) {
  try {
    const appointmentId =
      Number(req.params.id);

    if (
      !Number.isInteger(appointmentId) ||
      appointmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Identificador de cita inválido.",
      });
    }

    const appointment =
      appointmentService.cancelAppointment(
        req.user.userId,
        appointmentId
      );

    return res.json({
      success: true,
      message: "La cita fue cancelada correctamente.",
      appointment,
    });
  } catch (error) {
    console.error("ERROR AL CANCELAR CITA:", error);

    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.message ||
          "No se pudo cancelar la cita.",
      });
  }
}

module.exports = {
  availability,
  create,
  myAppointments,
  cancel,
};