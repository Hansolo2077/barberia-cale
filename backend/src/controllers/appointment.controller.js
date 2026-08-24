const appointmentService =
  require("../services/appointment.service");

const {
  isValidIsoDate,
} = require("../utils/date");

const {
  buildPaginationMeta,
  getPagination,
} = require("../utils/pagination");

const {
  sendControllerError,
} = require("../utils/http-error");

const ALLOWED_SERVICES = new Set([
  "Corte de cabello",
]);

async function availability(
  req,
  res
) {
  try {
    const { date } = req.query;

    if (
      !date ||
      !isValidIsoDate(date)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Debes proporcionar una fecha válida.",
      });
    }

    const result =
      await appointmentService
        .getAvailability(
          date,
          req.user.userId
        );

    return res.json({
      success: true,
      date,
      ...result,
    });
  } catch (error) {
    console.error(
      "ERROR CONSULTANDO DISPONIBILIDAD:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "No se pudo consultar la disponibilidad.",
    });
  }
}

async function nextAvailability(
  req,
  res
) {
  try {
    const {
      startDate,
    } = req.query;

    if (!isValidIsoDate(startDate)) {
      return res.status(400).json({
        success: false,
        message:
          "Debes proporcionar una fecha inicial válida.",
      });
    }

    const result = await appointmentService
      .getNextAvailableDate(
        startDate,
        req.user.userId
      );

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "ERROR CONSULTANDO PRÓXIMA DISPONIBILIDAD:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "No se pudo buscar la próxima fecha disponible.",
    });
  }
}

async function create(
  req,
  res
) {
  try {
    const body =
      req.body &&
      typeof req.body === "object" &&
      !Array.isArray(req.body)
        ? req.body
        : {};

    const {
      service,
      date,
      time,
    } = body;

    if (
      typeof service !== "string" ||
      typeof date !== "string" ||
      typeof time !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Servicio, fecha y hora son obligatorios.",
      });
    }

    const normalizedService = service.trim();

    if (!ALLOWED_SERVICES.has(normalizedService)) {
      return res.status(400).json({
        success: false,
        message:
          "El servicio seleccionado no es válido.",
      });
    }

    if (
      !isValidIsoDate(date)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La fecha no es válida.",
      });
    }

    const appointment =
      await appointmentService
        .createAppointment({
          userId:
            req.user.userId,
          service: normalizedService,
          date,
          time,
        });

    return res
      .status(201)
      .json({
        success: true,
        message:
          "Cita solicitada correctamente.",
        appointment,
      });
  } catch (error) {
    console.error(
      "ERROR CREANDO CITA:",
      error
    );

    return sendControllerError(
      res,
      error,
      "No se pudo crear la cita."
    );
  }
}

async function myAppointments(
  req,
  res
) {
  try {
    const pagination = getPagination(
      req.query
    );

    const result =
      await appointmentService
        .getUserAppointments(
          req.user.userId,
          pagination
        );

    return res.json({
      success: true,
      appointments:
        result.appointments,
      pagination:
        buildPaginationMeta({
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        }),
      policy:
        appointmentService.BOOKING_POLICY,
    });
  } catch (error) {
    console.error(
      "ERROR CONSULTANDO CITAS DEL USUARIO:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "No se pudieron consultar tus citas.",
    });
  }
}

async function cancel(
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
        .cancelAppointment(
          req.user.userId,
          appointmentId
        );

    return res.json({
      success: true,
      message:
        "La cita fue cancelada correctamente.",
      appointment,
    });
  } catch (error) {
    console.error(
      "ERROR AL CANCELAR CITA:",
      error
    );

    return sendControllerError(
      res,
      error,
      "No se pudo cancelar la cita."
    );
  }
}

async function confirmAttendance(
  req,
  res
) {
  try {
    const appointmentId = Number(req.params.id);

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

    const appointment = await appointmentService
      .confirmAppointmentAttendance(
        req.user.userId,
        appointmentId
      );

    return res.json({
      success: true,
      message:
        "Tu asistencia quedó confirmada.",
      appointment,
    });
  } catch (error) {
    console.error(
      "ERROR CONFIRMANDO ASISTENCIA:",
      error
    );

    return sendControllerError(
      res,
      error,
      "No se pudo confirmar tu asistencia."
    );
  }
}

module.exports = {
  availability,
  nextAvailability,
  create,
  myAppointments,
  cancel,
  confirmAttendance,
};
