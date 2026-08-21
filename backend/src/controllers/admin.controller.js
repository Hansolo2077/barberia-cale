const appointmentService =
  require("../services/appointment.service");

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

async function getAppointments(
  req,
  res
) {
  try {
    const {
      startDate,
      endDate,
    } = req.query;

    // Sin filtros:
    // Gestión de citas obtiene todas las citas.
    if (!startDate && !endDate) {
      const appointments =
        await appointmentService
          .getAllAppointments();

      return res.json({
        success: true,
        appointments,
      });
    }

    // Si viene solo una fecha,
    // la solicitud es incompleta.
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message:
          "Debes indicar la fecha inicial y la fecha final.",
      });
    }

    if (
      !isValidDate(startDate) ||
      !isValidDate(endDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Las fechas deben tener formato AAAA-MM-DD.",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message:
          "La fecha inicial no puede ser posterior a la fecha final.",
      });
    }

    const appointments =
      await appointmentService
        .getAppointmentsByDateRange(
          startDate,
          endDate
        );

    return res.json({
      success: true,
      startDate,
      endDate,
      appointments,
    });
  } catch (error) {
    console.error(
      "ERROR CONSULTANDO CITAS ADMIN:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "No se pudieron consultar las citas.",
    });
  }
}

async function acceptAppointment(
  req,
  res
) {
  try {
    const appointmentId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        appointmentId
      ) ||
      appointmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identificador de cita inválido.",
      });
    }

    const appointment =
      await appointmentService
        .acceptAppointment(
          appointmentId
        );

    return res.json({
      success: true,
      message:
        "La cita fue aceptada correctamente.",
      appointment,
    });
  } catch (error) {
    console.error(
      "ERROR ACEPTANDO CITA:",
      error
    );

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "No se pudo aceptar la cita.",
      });
  }
}

async function rejectAppointment(
  req,
  res
) {
  try {
    const appointmentId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        appointmentId
      ) ||
      appointmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identificador de cita inválido.",
      });
    }

    const appointment =
      await appointmentService
        .rejectAppointment(
          appointmentId
        );

    return res.json({
      success: true,
      message:
        "La cita fue rechazada correctamente.",
      appointment,
    });
  } catch (error) {
    console.error(
      "ERROR RECHAZANDO CITA:",
      error
    );

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "No se pudo rechazar la cita.",
      });
  }
}

async function cancelAppointment(
  req,
  res
) {
  try {
    const appointmentId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        appointmentId
      ) ||
      appointmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identificador de cita inválido.",
      });
    }

    const appointment =
      await appointmentService
        .cancelAppointmentByAdmin(
          appointmentId
        );

    return res.json({
      success: true,
      message:
        "La cita fue cancelada administrativamente.",
      appointment,
    });
  } catch (error) {
    console.error(
      "ERROR CANCELANDO CITA ADMIN:",
      error
    );

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "No se pudo cancelar la cita.",
      });
  }
}

async function completeAppointment(
  req,
  res
) {
  try {
    const appointmentId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        appointmentId
      ) ||
      appointmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identificador de cita inválido.",
      });
    }

    const appointment =
      await appointmentService
        .completeAppointment(
          appointmentId
        );

    return res.json({
      success: true,
      message:
        "La cita fue marcada como completada.",
      appointment,
    });
  } catch (error) {
    console.error(
      "ERROR COMPLETANDO CITA:",
      error
    );

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "No se pudo completar la cita.",
      });
  }
}

module.exports = {
  getAppointments,
  acceptAppointment,
  rejectAppointment,
  cancelAppointment,
  completeAppointment,
};