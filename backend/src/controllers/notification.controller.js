const notificationService =
  require("../services/notification.service");

const {
  normalizeExpoPushToken,
} = require("../utils/expo-push-token");

const {
  sendControllerError,
} = require("../utils/http-error");

const VALID_PLATFORMS = new Set([
  "android",
  "ios",
]);

function getRequestBody(req) {
  return req.body &&
    typeof req.body === "object" &&
    !Array.isArray(req.body)
    ? req.body
    : {};
}

async function registerDevice(req, res) {
  try {
    const body = getRequestBody(req);
    const expoPushToken =
      normalizeExpoPushToken(body.expoPushToken);

    if (!expoPushToken) {
      return res.status(400).json({
        success: false,
        message:
          "El token de notificaciones no es válido.",
      });
    }

    if (!VALID_PLATFORMS.has(body.platform)) {
      return res.status(400).json({
        success: false,
        message:
          "La plataforma debe ser android o ios.",
      });
    }

    const device = await notificationService.registerDevice({
      userId: req.user.userId,
      expoPushToken,
      platform: body.platform,
    });

    return res.json({
      success: true,
      message:
        "Este dispositivo recibirá recordatorios.",
      device,
    });
  } catch (error) {
    console.error(
      "ERROR REGISTRANDO DISPOSITIVO PUSH:",
      error
    );

    return sendControllerError(
      res,
      error,
      "No se pudo registrar el dispositivo."
    );
  }
}

async function deactivateDevice(req, res) {
  try {
    const body = getRequestBody(req);
    const expoPushToken =
      normalizeExpoPushToken(body.expoPushToken);

    if (!expoPushToken) {
      return res.status(400).json({
        success: false,
        message:
          "El token de notificaciones no es válido.",
      });
    }

    const device = await notificationService.deactivateDevice(
      req.user.userId,
      expoPushToken
    );

    return res.json({
      success: true,
      message:
        "El dispositivo dejó de recibir recordatorios para esta cuenta.",
      deactivated: Boolean(device),
    });
  } catch (error) {
    console.error(
      "ERROR DESACTIVANDO DISPOSITIVO PUSH:",
      error
    );

    return sendControllerError(
      res,
      error,
      "No se pudo desactivar el dispositivo."
    );
  }
}

module.exports = {
  registerDevice,
  deactivateDevice,
};
