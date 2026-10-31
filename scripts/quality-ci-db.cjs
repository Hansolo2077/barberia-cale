// Bootstrap Supabase-compatible role names only in the disposable CI database.
const { Client } = require('../backend/node_modules/pg');
const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== '127.0.0.1' || url.pathname !== '/qa_iii' || process.env.CI !== 'true') {
  throw new Error('This bootstrap is restricted to the disposable local CI database');
}
(async () => {
  const db = new Client({ connectionString: url.toString() });
  try {
    await db.connect();
    for (const role of ['anon', 'authenticated', 'service_role']) {
      if (!(await db.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [role])).rowCount) {
        await db.query(`CREATE ROLE ${role} NOLOGIN`);
      }
    }
  } finally { await db.end(); }
})();
