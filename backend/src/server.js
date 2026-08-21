require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const appointmentRoutes =
  require("./routes/appointment.routes");
const adminRoutes =
  require("./routes/admin.routes");

const app = express();

const PORT =
  process.env.PORT || 4000;

// CORS
const corsOptions = {
  origin: [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
  ],

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

// Middleware global
// Debe ejecutarse ANTES de las rutas.
app.use(cors(corsOptions));

app.use(express.json());

// Rutas
app.use(
  "/api/health",
  healthRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/appointments",
  appointmentRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

// Servidor
app.listen(PORT, () => {
  console.log(
    `Servidor Barbería Cale ejecutándose en puerto ${PORT}`
  );
});