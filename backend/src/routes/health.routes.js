const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API de Barbería Cale funcionando",
  });
});

module.exports = router;