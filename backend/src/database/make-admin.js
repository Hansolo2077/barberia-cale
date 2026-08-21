const db = require("./db");

const phone = "86666666";

const result = db
  .prepare(`
    UPDATE users
    SET role = 'ADMIN'
    WHERE phone = ?
  `)
  .run(phone);

if (result.changes === 0) {
  console.log(
    "No se encontró un usuario con ese número."
  );
} else {
  console.log(
    `El usuario ${phone} ahora es ADMIN.`
  );
}