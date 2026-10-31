const path = require('node:path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env'), quiet: true });
const { Client } = require('../backend/node_modules/pg');
(async () => {
  console.log(JSON.stringify({ node: process.version, databaseConfigured: !!process.env.DATABASE_URL, jwtConfigured: !!process.env.JWT_SECRET }));
  if (!process.env.DATABASE_URL) return;
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000, statement_timeout: 15000 });
  try {
    await client.connect();
    const { rows } = await client.query("SELECT current_setting('server_version') AS version, has_database_privilege(current_database(), 'CREATE') AS can_create_schema");
    console.log(JSON.stringify({ databaseReachable: true, ...rows[0] }));
  } catch (error) {
    console.log(JSON.stringify({ databaseReachable: false, code: error.code || error.name }));
    process.exitCode = 1;
  } finally { await client.end(); }
})();
