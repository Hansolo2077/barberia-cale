const express = require("express");

const appointmentController =
  require("../controllers/appointment.controller");

const {
  authenticateToken,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/availability",
  authenticateToken,
  appointmentController.availability
);

router.post(
  "/",
  authenticateToken,
  appointmentController.create
);

router.get(
  "/my",
  authenticateToken,
  appointmentController.myAppointments
);

router.patch(
  "/:id/cancel",
  authenticateToken,
  appointmentController.cancel
);

module.exports = router;