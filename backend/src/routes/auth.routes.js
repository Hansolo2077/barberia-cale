const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

const {
  authenticateToken,
} = require("../middleware/auth.middleware");

router.post("/register", authController.register);

router.post("/login", authController.login);

module.exports = router;

router.get(
  "/me",
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      message: "Token válido.",
      user: req.user,
    });
  }
);