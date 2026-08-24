const appointmentService =
  require("../services/appointment.service");

const {
  daysBetween,
  isValidIsoDate,
} = require("../utils/date");

const {
  buildPaginationMeta,
  getPagination,
} = require("../utils/pagination");

const {
  sendControllerError,
} = require("../utils/http-error");

const MAX_SCHEDULE_RANGE_DAYS = 92;
const VALID_STATUSES = new Set([
  "PENDING",
  "ACCEPTED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
]);

async function getAppointments(
  req,
  res
) {
  try {
    const {
      startDate,
      endDate,
      status,
      search = "",
      upcomingOnly = "false",
    } = req.query;

    const normalizedStatus =
      status && status !== "ALL"
        ? status
        : null;

    if (
      normalizedStatus &&
      !VALID_STATUSES.has(normalizedStatus)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El estado seleccionado no es válido.",
      });
    }

    if (
      typeof search !== "string" ||
      search.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La búsqueda no puede superar 100 caracteres.",
      });
    }

    if (
      upcomingOnly !== "true" &&
      upcomingOnly !== "false"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El filtro de próximas citas no es válido.",
      });
    }

    const pagination = getPagination(
      req.query
    );

    const queryOptions = {
      ...pagination,
      status: normalizedStatus,
      search,
      upcomingOnly: upcomingOnly === "true",
    };

    // Sin filtros:
    // Gestión de citas obtiene todas las citas.
    if (!startDate && !endDate) {
      const result =
        await appointmentService
          .getAllAppointments(
            queryOptions
          );

      return res.json({
        success: true,
        appointments:
          result.appointments,
        statusCounts:
          result.statusCounts,
        pagination:
          buildPaginationMeta({
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
          }),
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
      !isValidIsoDate(startDate) ||
      !isValidIsoDate(endDate)
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

    if (
      daysBetween(startDate, endDate) >
      MAX_SCHEDULE_RANGE_DAYS
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El rango máximo de consulta es de 93 días.",
      });
    }

    const result =
      await appointmentService
        .getAppointmentsByDateRange(
          startDate,
          endDate,
          queryOptions
        );

    return res.json({
      success: true,
      startDate,
      endDate,
      appointments:
        result.appointments,
      statusCounts:
        result.statusCounts,
      pagination:
        buildPaginationMeta({
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        }),
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

    return sendControllerError(
      res,
      error,
      "No se pudo aceptar la cita."
    );
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

    return sendControllerError(
      res,
      error,
      "No se pudo rechazar la cita."
    );
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

    return sendControllerError(
      res,
      error,
      "No se pudo cancelar la cita."
    );
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

    return sendControllerError(
      res,
      error,
      "No se pudo completar la cita."
    );
  }
}

module.exports = {
  getAppointments,
  acceptAppointment,
  rejectAppointment,
  cancelAppointment,
  completeAppointment,
};
