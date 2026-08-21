function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Debes iniciar sesión.",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para realizar esta acción.",
    });
  }

  next();
}

module.exports = {
  requireAdmin,
};