const bcrypt = require("bcryptjs");
const db = require("../database/db");

function registerUser({ firstName, lastName, phone, password }) {
  // Buscar si ya existe el celular
  const existingUser = db
    .prepare("SELECT id FROM users WHERE phone = ?")
    .get(phone);

  if (existingUser) {
    const error = new Error(
      "Ya existe una cuenta registrada con este número de celular."
    );

    error.statusCode = 409;
    throw error;
  }

  // Convertir la contraseña en un hash seguro
  const passwordHash = bcrypt.hashSync(password, 10);

  // Insertar usuario
  const result = db
    .prepare(`
      INSERT INTO users (
        first_name,
        last_name,
        phone,
        password_hash,
        role
      )
      VALUES (?, ?, ?, ?, 'CLIENT')
    `)
    .run(
      firstName.trim(),
      lastName.trim(),
      phone,
      passwordHash
    );

  return {
    id: result.lastInsertRowid,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone,
    role: "CLIENT",
  };
}

module.exports = {
  registerUser,
  findUserByPhone,
  verifyPassword,
};

function findUserByPhone(phone) {
  return db
    .prepare(`
      SELECT
        id,
        first_name,
        last_name,
        phone,
        password_hash,
        role
      FROM users
      WHERE phone = ?
    `)
    .get(phone);
}

function verifyPassword(password, passwordHash) {
  return bcrypt.compareSync(password, passwordHash);
}