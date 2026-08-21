require("dotenv").config();

const db = require("./db");

const phone = "88888888";

async function makeAdmin() {
  try {
    const result = await db.query(
      `
        UPDATE users
        SET role = 'ADMIN'
        WHERE phone = $1
        RETURNING
          id,
          first_name,
          last_name,
          phone,
          role
      `,
      [phone]
    );

    if (result.rows.length === 0) {
      console.log(
        "No se encontró un usuario con ese número."
      );
    } else {
      const user = result.rows[0];

      console.log(
        `El usuario ${user.first_name} ${user.last_name} (${user.phone}) ahora es ADMIN.`
      );
    }
  } catch (error) {
    console.error(
      "Error convirtiendo usuario a ADMIN:",
      error
    );

    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

makeAdmin();