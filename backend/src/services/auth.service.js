const bcrypt = require("bcryptjs");
const db = require("../database/db");

async function registerUser({
  firstName,
  lastName,
  phone,
  password,
}) {
  const cleanFirstName =
    firstName.trim();

  const cleanLastName =
    lastName.trim();

  const existingUserResult =
    await db.query(
      `
        SELECT id
        FROM users
        WHERE phone = $1
        LIMIT 1
      `,
      [phone]
    );

  if (
    existingUserResult.rows.length > 0
  ) {
    const error = new Error(
      "Ya existe una cuenta registrada con este número de celular."
    );

    error.statusCode = 409;
    throw error;
  }

  const passwordHash =
    await bcrypt.hash(
      password,
      10
    );

  try {
    const insertResult =
      await db.query(
        `
          INSERT INTO users (
            first_name,
            last_name,
            phone,
            password_hash,
            role
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            'CLIENT'
          )
          RETURNING
            id,
            first_name,
            last_name,
            phone,
            role
        `,
        [
          cleanFirstName,
          cleanLastName,
          phone,
          passwordHash,
        ]
      );

    const user =
      insertResult.rows[0];

    return {
      id: Number(user.id),
      firstName:
        user.first_name,
      lastName:
        user.last_name,
      phone:
        user.phone,
      role:
        user.role,
    };
  } catch (error) {
    /*
     * PostgreSQL unique_violation.
     * This protects us against a race condition
     * where two requests try to register the
     * same phone number at nearly the same time.
     */
    if (error.code === "23505") {
      const conflictError =
        new Error(
          "Ya existe una cuenta registrada con este número de celular."
        );

      conflictError.statusCode =
        409;

      throw conflictError;
    }

    throw error;
  }
}

async function findUserByPhone(
  phone
) {
  const result =
    await db.query(
      `
        SELECT
          id,
          first_name,
          last_name,
          phone,
          password_hash,
          role
        FROM users
        WHERE phone = $1
        LIMIT 1
      `,
      [phone]
    );

  return result.rows[0];
}

async function findPublicUserById(
  userId
) {
  const result = await db.query(
    `
      SELECT
        id,
        first_name AS "firstName",
        last_name AS "lastName",
        phone,
        role
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  const user = result.rows[0];

  return user
    ? {
        ...user,
        id: Number(user.id),
      }
    : null;
}

async function verifyPassword(
  password,
  passwordHash
) {
  return bcrypt.compare(
    password,
    passwordHash
  );
}

module.exports = {
  registerUser,
  findUserByPhone,
  findPublicUserById,
  verifyPassword,
};
