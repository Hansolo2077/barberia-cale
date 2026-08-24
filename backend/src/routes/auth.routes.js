const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

const {
  authenticateToken,
} = require("../middleware/auth.middleware");

const {
  createRateLimiter,
} = require("../middleware/rate-limit.middleware");

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message:
    "Demasiados intentos de acceso. Espera 15 minutos antes de reintentar.",
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  message:
    "Se alcanzó el límite temporal de registros. Inténtalo más tarde.",
});

router.post(
  "/register",
  registerLimiter,
  authController.register
);

router.post(
  "/login",
  loginLimiter,
  authController.login
);

router.get(
  "/me",
  authenticateToken,
  authController.me
);

module.exports = router;
