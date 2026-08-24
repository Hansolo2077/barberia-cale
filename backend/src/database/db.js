const {
  Pool,
  types,
} = require("pg");

// BIGSERIAL usa int8 y node-postgres lo entrega como string por defecto.
// Los IDs de esta aplicación deben coincidir con los contratos numéricos del
// frontend; fallamos explícitamente antes de perder precisión silenciosamente.
types.setTypeParser(20, (value) => {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new RangeError(
      "El identificador excede el rango numérico seguro."
    );
  }

  return parsed;
});

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log(
    "Conectado a PostgreSQL."
  );
});

pool.on("error", (error) => {
  console.error(
    "Error inesperado en PostgreSQL:",
    error
  );
});

module.exports = pool;
