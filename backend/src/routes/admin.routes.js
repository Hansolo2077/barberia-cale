const adminController =
  require("../controllers/admin.controller");

const express = require("express");

const {
  authenticateToken,
} = require("../middleware/auth.middleware");

const {
  requireAdmin,
} = require("../middleware/admin.middleware");

const router = express.Router();

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