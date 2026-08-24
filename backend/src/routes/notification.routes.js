const express = require("express");

const notificationController =
  require("../controllers/notification.controller");

const {
  authenticateToken,
} = require("../middleware/auth.middleware");

const {
  requireClient,
} = require("../middleware/client.middleware");

const router = express.Router();

router.use(authenticateToken, requireClient);

router.put(
  "/device",
  notificationController.registerDevice
);

router.delete(
  "/device",
  notificationController.deactivateDevice
);

module.exports = router;
