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

// Render termina TLS delante de Express. Confiar en un solo proxy permite
// que req.ip use la IP original sin aceptar cadenas arbitrarias de proxies.
app.set("trust proxy", 1);

const PORT =
  process.env.PORT || 4000;

const configuredOrigins = (
  process.env.CORS_ORIGINS || ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  ...configuredOrigins,
]);

const netlifyPreviewOrigin =
  /^https:\/\/[a-z0-9-]+\.netlify\.app$/i;

// CORS para desarrollo, el sitio publicado y previews verificables.
const corsOptions = {
  origin(origin, callback) {
    const isAllowed =
      !origin ||
      allowedOrigins.has(origin) ||
      netlifyPreviewOrigin.test(origin);

    callback(null, isAllowed);
  },

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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      "La ruta solicitada no existe.",
  });
});

// Servidor
app.listen(PORT, () => {
  console.log(
    `Servidor Barbería Cale ejecutándose en puerto ${PORT}`
  );
});
