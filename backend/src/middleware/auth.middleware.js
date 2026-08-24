const jwt = require("jsonwebtoken");
const authService =
  require("../services/auth.service");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Debes iniciar sesión para realizar esta acción.",
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      success: false,
      message: "Token de autenticación inválido.",
    });
  }

  const token = parts[1];

  let decoded;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );
  } catch {
    return res.status(401).json({
      success: false,
      message: "Tu sesión no es válida o ha expirado.",
    });
  }

  const userId = Number(decoded.userId);

  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0
  ) {
    return res.status(401).json({
      success: false,
      message: "Token de autenticación inválido.",
    });
  }

  try {
    const currentUser = await authService
      .findPublicUserById(userId);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message:
          "La cuenta asociada a esta sesión ya no existe.",
      });
    }

    req.user = {
      userId: currentUser.id,
      role: currentUser.role,
    };
    req.currentUser = currentUser;

    return next();
  } catch (error) {
    console.error(
      "ERROR VALIDANDO USUARIO AUTENTICADO:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "No se pudo validar la sesión en este momento.",
    });
  }
}

module.exports = {
  authenticateToken,
};
