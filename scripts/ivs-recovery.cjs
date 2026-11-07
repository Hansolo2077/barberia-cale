/* Logical application-data recovery drill. Only random ivs_restore_* schemas.
 * Never reads production tables or contacts notification providers. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
require('../backend/node_modules/dotenv').config({ path: path.join(root, 'backend/.env'), quiet: true });
const { Client } = require('../backend/node_modules/pg');
const out = path.resolve(process.argv[2] || 'docs/evidencias_pruebas/ivs-2026-11-07');
const stamp = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const schemas = [`ivs_restore_${stamp}_source`, `ivs_restore_${stamp}_target`];
const tables = ['users', 'appointments', 'push_device_tokens', 'appointment_notification_jobs'];
const sqlFiles = ['backend/src/database/schema.sql', ...fs.readdirSync(path.join(root, 'backend/src/database/migrations')).filter(f => f.endsWith('.sql')).sort().map(f => 'backend/src/database/migrations/' + f)];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const report = { startedAt: new Date().toISOString(), executor: 'Codex con autorizacion de Hanssel', sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), scope: 'Respaldo logico de cuatro tablas con datos sinteticos, restaurado en esquema independiente reconstruido desde SQL versionado. No es pg_dump ni backup completo de Supabase.', steps: [], cleanup: false };
const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000, statement_timeout: 30000 });
async function install(schema) {
  assert.match(schema, /^ivs_restore_\d+_[a-f0-9]{6}_(source|target)$/);
  await db.query(`CREATE SCHEMA ${schema}`);
  await db.query(`SET search_path TO ${schema}`);
  for (const file of sqlFiles) await db.query(fs.readFileSync(path.join(root, file), 'utf8').replace(/\bpublic\b/g, schema).replace(/\breminder_api\b/g, schema + '_api').replace(/NOTIFY pgrst, 'reload schema';/g, ''));
}
async function snapshot(schema) {
  const data = {};
  for (const table of tables) data[table] = (await db.query(`SELECT to_jsonb(t) AS row FROM ${schema}.${table} t ORDER BY id`)).rows.map(r => r.row);
  return data;
}
(async () => {
  try {
    await db.connect();
    report.postgresql = (await db.query('SHOW server_version')).rows[0].server_version;
    report.schemaSources = sqlFiles.map(file => ({ file, sha256: hash(fs.readFileSync(path.join(root, file))) }));
    const [source, target] = schemas;
    await install(source);
    fs.mkdirSync(out, { recursive: true });
    const dictionary = {
      columns: (await db.query("SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default,character_maximum_length FROM information_schema.columns WHERE table_schema=$1 ORDER BY table_name,ordinal_position", [source])).rows,
      constraints: (await db.query('SELECT c.relname AS table_name, con.conname AS name, pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 ORDER BY c.relname,con.conname', [source])).rows,
      indexes: (await db.query('SELECT tablename AS table_name,indexname AS name,indexdef AS definition FROM pg_indexes WHERE schemaname=$1 ORDER BY tablename,indexname', [source])).rows,
    };
    const dictionaryText = JSON.stringify(dictionary, null, 2).replaceAll(source, '<esquema_prueba>');
    fs.writeFileSync(path.join(out, 'diccionario.json'), dictionaryText + '\n');
    let md = '# Diccionario de datos verificado\n\nGenerado desde PostgreSQL despues de ejecutar schema.sql y las cuatro migraciones. Solo estructura; sin registros de personas.\n\n';
    for (const table of tables) {
      md += `## ${table}\n\n| Campo | Tipo | Nulo | Valor por defecto |\n| --- | --- | --- | --- |\n`;
      for (const c of dictionary.columns.filter(c => c.table_name === table)) md += `| ${c.column_name} | ${c.data_type}${c.character_maximum_length ? '(' + c.character_maximum_length + ')' : ''} | ${c.is_nullable} | ${(c.column_default || '').replaceAll(source, '<esquema>').replaceAll('|', '\\|')} |\n`;
      md += '\nRestricciones:\n\n';
      for (const c of dictionary.constraints.filter(c => c.table_name === table)) md += `- ${c.name}: ${c.definition.replaceAll(source, '<esquema>')}\n`;
      md += '\n';
    }
    fs.writeFileSync(path.join(out, 'diccionario.md'), md);
    // Deliberately not usable credentials, phone contacts or real push tokens.
    await db.query("INSERT INTO users(id,first_name,last_name,phone,password_hash,role) VALUES (1,'Fixture','Cliente','55501001','SYNTHETIC_NOT_A_PASSWORD','CLIENT'),(2,'Fixture','Admin','55501002','SYNTHETIC_NOT_A_PASSWORD','ADMIN')");
    await db.query("INSERT INTO appointments(id,user_id,service,appointment_date,appointment_time,status) VALUES (1,1,'Corte de cabello',CURRENT_DATE+10,'09:00','ACCEPTED')");
    await db.query("INSERT INTO push_device_tokens(id,user_id,expo_push_token,platform) VALUES (1,1,'SYNTHETIC_NOT_A_DEVICE','android')");
    await db.query("INSERT INTO appointment_notification_jobs(id,appointment_id,requested_by_user_id) VALUES (1,1,2)");
    const before = await snapshot(source);
    fs.mkdirSync(out, { recursive: true });
    const backupPath = path.join(out, 'respaldo-sintetico.json');
    fs.writeFileSync(backupPath, JSON.stringify({ format: 'ivs-application-data-v1', synthetic: true, tables: before }, null, 2) + '\n');
    const saved = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    report.backup = { path: path.relative(root, backupPath).replaceAll('\\', '/'), sha256: hash(fs.readFileSync(backupPath)), rows: Object.fromEntries(tables.map(t => [t, before[t].length])) };
    report.steps.push({ id: 'REC-01', action: 'Exportar datos sinteticos de cuatro tablas a archivo y releerlo', status: 'PASS' });
    // Simulated loss affects only this generated test appointment.
    await db.query(`UPDATE ${source}.appointments SET status='CANCELLED' WHERE id=1`);
    assert.notDeepEqual(await snapshot(source), saved.tables);
    report.steps.push({ id: 'REC-02', action: 'Simular alteracion posterior al respaldo en origen sintetico', status: 'PASS' });
    const start = performance.now();
    await install(target);
    await db.query('BEGIN');
    try {
      for (const table of tables) {
        await db.query(`INSERT INTO ${target}.${table} SELECT * FROM jsonb_populate_recordset(NULL::${target}.${table}, $1::jsonb)`, [JSON.stringify(saved.tables[table])]);
        await db.query(`SELECT setval(pg_get_serial_sequence('${target}.${table}','id'), COALESCE((SELECT MAX(id) FROM ${target}.${table}),1), EXISTS(SELECT 1 FROM ${target}.${table}))`);
      }
      await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK'); throw error; }
    const restored = await snapshot(target);
    assert.deepEqual(restored, saved.tables);
    report.restoreMs = Math.round(performance.now() - start);
    report.contentHashes = { backup: hash(JSON.stringify(saved.tables)), restored: hash(JSON.stringify(restored)) };
    report.steps.push({ id: 'REC-03', action: 'Reconstruir SQL, importar archivo, comparar todas las columnas y restablecer secuencias', status: 'PASS', exactDataMatch: true });
    let fkCode;
    await db.query('BEGIN');
    try { await db.query(`INSERT INTO ${target}.appointments(user_id,service,appointment_date,appointment_time) VALUES (-1,'Corte de cabello',CURRENT_DATE+20,'10:00')`); } catch (error) { fkCode = error.code; }
    await db.query('ROLLBACK'); assert.equal(fkCode, '23503');
    const inserted = (await db.query(`INSERT INTO ${target}.users(first_name,last_name,phone,password_hash) VALUES ('Nuevo','Fixture','55501003','SYNTHETIC_NOT_A_PASSWORD') RETURNING id`)).rows[0];
    assert.equal(Number(inserted.id), 3);
    report.steps.push({ id: 'REC-04', action: 'Verificar FK restaurada y siguiente ID sin colision', status: 'PASS', fkCode, nextUserId: Number(inserted.id) });
    report.status = 'PASS';
    report.limitations = ['Sin ensayo de caida de proveedor, point-in-time recovery, roles globales, storage, cron, Vault o secretos.', 'Tiempo observado de laboratorio; no constituye compromiso RTO/RPO productivo.', 'El archivo contiene exclusivamente fixtures desechables.'];
  } catch (error) {
    report.status = 'FAIL'; report.error = { name: error.name, code: error.code, message: 'Fallo de restauracion; no se publican cadenas de conexion ni datos de operacion.' }; process.exitCode = 1;
  } finally {
    try {
      await db.query('ROLLBACK');
      for (const schema of schemas) {
        assert.match(schema, /^ivs_restore_\d+_[a-f0-9]{6}_(source|target)$/);
        await db.query(`DROP SCHEMA IF EXISTS ${schema}_api CASCADE`);
        await db.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      }
      report.cleanup = true;
    } catch (error) { report.cleanupError = { code: error.code }; report.status = 'FAIL'; process.exitCode = 1; }
    await db.end(); report.finishedAt = new Date().toISOString();
    fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'restauracion.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, steps: report.steps, cleanup: report.cleanup }));
  }
})();
