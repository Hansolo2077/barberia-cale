const Database = require("better-sqlite3");
const path = require("path");

const databasePath = path.join(
  __dirname,
  "../../../barberia-cale.db"
);

const db = new Database(databasePath);

// Activar soporte para claves foráneas
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CLIENT'
      CHECK (role IN ('CLIENT', 'ADMIN')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    service TEXT NOT NULL,

    appointment_date TEXT NOT NULL,

    appointment_time TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'PENDING'
      CHECK (
        status IN (
          'PENDING',
          'ACCEPTED',
          'REJECTED',
          'CANCELLED'
        )
      ),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
  );
`);

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS
    idx_unique_active_appointment
  ON appointments (
    appointment_date,
    appointment_time
  )
  WHERE status IN ('PENDING', 'ACCEPTED');
`);

module.exports = db;