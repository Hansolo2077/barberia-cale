require("dotenv").config();

const db = require("./db");

async function testDatabase() {
  try {
    const result = await db.query(`
      SELECT
        NOW() AS current_time,
        current_database() AS database_name
    `);

    console.log(
      "PostgreSQL connection successful:"
    );

    console.log(result.rows[0]);
  } catch (error) {
    console.error(
      "PostgreSQL connection failed:",
      error
    );
  } finally {
    await db.end();
  }
}

testDatabase();