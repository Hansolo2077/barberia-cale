function requireClient(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Debes iniciar sesión.",
    });
  }

  if (req.user.role !== "CLIENT") {
    return res.status(403).json({
      success: false,
      message:
        "Esta función está disponible únicamente para clientes.",
    });
  }

  return next();
}

module.exports = {
  requireClient,
};
