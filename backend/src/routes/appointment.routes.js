const express = require("express");

const appointmentController =
  require("../controllers/appointment.controller");

const {
  authenticateToken,
} = require("../middleware/auth.middleware");
const {
  requireClient,
} = require("../middleware/client.middleware");

const router = express.Router();

router.use(authenticateToken, requireClient);

router.get(
  "/availability",
  appointmentController.availability
);

router.get(
  "/next-availability",
  appointmentController.nextAvailability
);

router.post("/", appointmentController.create);

router.get("/my", appointmentController.myAppointments);

router.patch(
  "/:id/cancel",
  appointmentController.cancel
);

router.patch(
  "/:id/confirm-attendance",
  appointmentController.confirmAttendance
);

module.exports = router;
