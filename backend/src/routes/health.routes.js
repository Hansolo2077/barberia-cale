const express = require("express");

const router = express.Router();
const { readBuildIdentity } = require("../utils/build-identity");

router.get("/", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    success: true,
    message: "API de Barbería Cale funcionando",
    build: readBuildIdentity(),
  });
});

module.exports = router;
