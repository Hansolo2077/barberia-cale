const adminController =
  require("../controllers/admin.controller");
const adminReminderController = require(
  "../controllers/admin-reminder.controller"
);

const express = require("express");

const {
  authenticateToken,
} = require("../middleware/auth.middleware");

const {
  requireAdmin,
} = require("../middleware/admin.middleware");

const {
  createRateLimiter,
} = require("../middleware/rate-limit.middleware");

const router = express.Router();

const bulkReminderLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 2,
  message:
    "Espera un momento antes de volver a enviar recordatorios masivos.",
});

const appointmentReminderLimiter =
  createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message:
      "Se alcanzó el límite temporal de recordatorios. Espera un momento antes de continuar.",
  });

router.get(
  "/attendance-reminders/summary",
  authenticateToken,
  requireAdmin,
  adminReminderController
    .getAttendanceReminderSummary
);

router.post(
  "/attendance-reminders",
  authenticateToken,
  requireAdmin,
  bulkReminderLimiter,
  adminReminderController
    .queueAttendanceReminders
);

router.post(
  "/appointments/:id/attendance-reminder",
  authenticateToken,
  requireAdmin,
  appointmentReminderLimiter,
  adminReminderController
    .queueAppointmentAttendanceReminder
);

router.patch(
  "/appointments/:id/accept",
  authenticateToken,
  requireAdmin,
  adminController.acceptAppointment
);

router.patch(
  "/appointments/:id/reject",
  authenticateToken,
  requireAdmin,
  adminController.rejectAppointment
);

router.get(
  "/appointments",
  authenticateToken,
  requireAdmin,
  adminController.getAppointments
);

router.patch(
  "/appointments/:id/cancel",
  authenticateToken,
  requireAdmin,
  adminController.cancelAppointment
);

router.patch(
  "/appointments/:id/complete",
  authenticateToken,
  requireAdmin,
  adminController.completeAppointment
);

router.get(
  "/test",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: "Acceso administrativo autorizado.",
      user: req.user,
    });
  }
);

module.exports = router;
