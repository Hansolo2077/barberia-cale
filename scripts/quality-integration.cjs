/* Real PostgreSQL + HTTP campaign. All writes are confined to random schemas.
 * Never invoke a push provider or modify the application's public schema. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
require('../backend/node_modules/dotenv').config({ path: path.join(root, 'backend/.env'), quiet: true });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const { Client } = require('../backend/node_modules/pg');
const express = require('../backend/node_modules/express');
const schema = `qa_iii_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const apiSchema = `${schema}_api`;
const output = path.resolve(process.argv[2] || 'docs/evidencias_pruebas/parcial-iii/integracion.json');
const dbUrl = process.env.DATABASE_URL;
const report = {
  startedAt: new Date().toISOString(), timeZone: 'America/Guatemala',
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  workingTreeChanges: true,
  environment: { node: process.version, platform: process.platform, database: 'PostgreSQL real; esquemas efimeros aislados', http: 'Express local con rutas y middleware reales', providers: 'Sin envio a Expo ni WhatsApp' },
  cases: [], performance: [], cleanup: false,
};
let db, server, base, clientToken, adminToken, otherToken, clientId, otherId, adminId, date, futureId;
const setup = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000, statement_timeout: 30000 });
const password = crypto.randomBytes(24).toString('base64url');
// A test JWT secret prevents this test server from issuing production sessions.
process.env.JWT_SECRET = crypto.randomBytes(48).toString('base64url');
const originalConsoleError = console.error;
console.error = () => {}; // Expected negative cases must not print request data.
async function request(route, { token, method = 'GET', body } = {}) {
  const res = await fetch(base + route, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  const payload = await res.json();
  return { status: res.status, payload };
}
async function check(id, requirements, title, steps, expected, fn) {
  const startedAt = new Date().toISOString();
  try {
    const observed = await fn();
    report.cases.push({ id, requirements, title, preconditions: 'Esquemas nuevos; usuarios sinteticos; API local; PostgreSQL real', steps, expected, observed, status: 'PASS', startedAt, finishedAt: new Date().toISOString() });
    console.log(`${id} PASS ${title}`);
  } catch (error) {
    report.cases.push({ id, requirements, title, steps, expected, status: 'FAIL', error: { name: error.name, code: error.code, message: error.message.slice(0, 800) }, startedAt, finishedAt: new Date().toISOString() });
    console.log(`${id} FAIL ${title}`);
  }
}
async function seedAppointment(userId, offset, time, status = 'ACCEPTED') {
  const result = await db.query(`INSERT INTO appointments (user_id,service,appointment_date,appointment_time,status) VALUES ($1,'Corte de cabello', (NOW() AT TIME ZONE 'America/Managua')::date + $2::int,$3::time,$4) RETURNING id`, [userId, offset, time, status]);
  return result.rows[0].id;
}
async function main() {
  await setup.connect();
  await setup.query(`CREATE SCHEMA ${schema}`);
  await setup.query(`SET search_path TO ${schema}`);
  report.environment.postgresql = (await setup.query('SHOW server_version')).rows[0].server_version;
  const sqlFiles = [path.join(root, 'backend/src/database/schema.sql'), ...fs.readdirSync(path.join(root, 'backend/src/database/migrations')).filter(f => f.endsWith('.sql')).sort().map(f => path.join(root, 'backend/src/database/migrations', f))];
  report.sqlFiles = sqlFiles.map(p => ({ file: path.relative(root, p).replaceAll('\\', '/'), sha256: crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') }));
  for (const file of sqlFiles) {
    const sql = fs.readFileSync(file, 'utf8').replace(/\bpublic\b/g, schema).replace(/\breminder_api\b/g, apiSchema).replace(/NOTIFY pgrst, 'reload schema';/g, '');
    await setup.query(sql);
  }
  const isolatedUrl = new URL(dbUrl);
  isolatedUrl.searchParams.set('options', `-c search_path=${schema} -c statement_timeout=30000`);
  process.env.DATABASE_URL = isolatedUrl.toString();
  db = require('../backend/src/database/db');
  const app = express();
  app.use(express.json());
  for (const [prefix, file] of [['auth', 'auth'], ['appointments', 'appointment'], ['admin', 'admin'], ['notifications', 'notification']]) app.use(`/api/${prefix}`, require(`../backend/src/routes/${file}.routes`));
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}/api`;
  date = (await db.query("SELECT to_char((NOW() AT TIME ZONE 'America/Managua')::date + 3,'YYYY-MM-DD') AS date")).rows[0].date;
  report.testData = { appointmentDate: date, users: 'Tres cuentas sinteticas en esquema efimero; ninguna cuenta real', password: 'Aleatoria en memoria, no publicada' };
  const appointmentService = require('../backend/src/services/appointment.service');
  const reminder = require('../backend/src/services/admin-reminder.service');
  const authService = require('../backend/src/services/auth.service');
  await check('PF-01', ['RF-01', 'RC-02'], 'Registro y hash sin exponer credenciales', ['POST /auth/register con datos sinteticos', 'Comprobar hash bcrypt y respuesta publica'], '201, rol CLIENT, hash distinto de la clave y ausencia de password_hash en respuesta', async () => {
    const r = await request('/auth/register', { method: 'POST', body: { firstName: 'Calidad', lastName: 'ParcialIII', phone: '55501981', password } });
    assert.equal(r.status, 201); clientToken = r.payload.token; clientId = r.payload.user.id;
    assert.equal(r.payload.user.role, 'CLIENT'); assert.equal(r.payload.user.password_hash, undefined);
    const row = (await db.query('SELECT password_hash FROM users WHERE id=$1', [clientId])).rows[0];
    assert.notEqual(row.password_hash, password); assert.ok(await authService.verifyPassword(password, row.password_hash));
    return { http: r.status, role: 'CLIENT', bcryptVerified: true, secretReturned: false };
  });
  const other = await request('/auth/register', { method: 'POST', body: { firstName: 'Otro', lastName: 'Sintetico', phone: '55501982', password } });
  assert.equal(other.status, 201); otherToken = other.payload.token; otherId = other.payload.user.id;
  const admin = await authService.registerUser({ firstName: 'Admin', lastName: 'Sintetico', phone: '55501983', password });
  adminId = admin.id; await db.query("UPDATE users SET role='ADMIN' WHERE id=$1", [adminId]);
  adminToken = (await request('/auth/login', { method: 'POST', body: { phone: '55501983', password } })).payload.token;
  await check('PF-02', ['RF-01'], 'Rechazo de registro duplicado', ['Repetir celular sintetico PF-01'], '409 y una sola cuenta', async () => { const r = await request('/auth/register', { method: 'POST', body: { firstName: 'Calidad', lastName: 'ParcialIII', phone: '55501981', password } }); assert.equal(r.status, 409); return { http: r.status }; });
  await check('PF-03', ['RF-02'], 'Login invalido y campos vacios', ['Enviar cuerpo vacio', 'Enviar clave incorrecta'], '400 y 401 respectivamente', async () => { const a = await request('/auth/login', { method: 'POST', body: {} }); const b = await request('/auth/login', { method: 'POST', body: { phone: '55501981', password: 'incorrecta' } }); assert.equal(a.status, 400); assert.equal(b.status, 401); return { empty: a.status, invalid: b.status }; });
  await check('PF-04', ['RF-16', 'RC-01'], 'Autorizacion HTTP por rol y token', ['GET /admin/appointments sin token, token invalido, CLIENT y ADMIN', 'GET /appointments/my con ADMIN'], '401,401,403,200 y 403; sin mutaciones', async () => {
    const statuses = []; for (const token of [undefined, 'invalid', clientToken, adminToken]) statuses.push((await request('/admin/appointments', { token })).status);
    statuses.push((await request('/appointments/my', { token: adminToken })).status); assert.deepEqual(statuses, [401,401,403,200,403]); return { statuses };
  });
  await check('PF-05', ['RF-05'], 'Disponibilidad y fecha invalida', ['Consultar fecha futura valida', 'Consultar 2026-02-30'], '200 con bloques y 400 para fecha imposible', async () => { const a=await request(`/appointments/availability?date=${date}`, { token: clientToken }); const b=await request('/appointments/availability?date=2026-02-30', { token: clientToken }); assert.equal(a.status,200); assert.equal(a.payload.times.length,10); assert.equal(b.status,400); return { valid:a.status, slots:a.payload.times.length, invalid:b.status }; });
  await check('PF-06', ['RF-06', 'RC-03'], 'Reserva valida y consulta persistida', ['Crear cita futura 08:00', 'GET /appointments/my y SELECT por ID'], '201 PENDING, mismo ID recuperado', async () => { const r=await request('/appointments', { token:clientToken,method:'POST',body:{service:'Corte de cabello',date,time:'08:00'} }); assert.equal(r.status,201); futureId=r.payload.appointment.id; const list=await request('/appointments/my',{token:clientToken}); assert.ok(list.payload.appointments.some(a=>a.id===futureId)); return { http:r.status, state:r.payload.appointment.status, recovered:true }; });
  await check('PF-07', ['RF-06', 'RC-03'], 'Limite de una cita activa diaria', ['Reservar otra hora el mismo dia para PF-06'], '409 y una cita activa', async () => { const r=await request('/appointments',{token:clientToken,method:'POST',body:{service:'Corte de cabello',date,time:'09:00'}}); assert.equal(r.status,409); const count=(await db.query("SELECT count(*)::int AS n FROM appointments WHERE user_id=$1 AND status IN ('PENDING','ACCEPTED')",[clientId])).rows[0].n; assert.equal(count,1); return {http:r.status,active:count}; });
  await check('PF-08', ['RF-06', 'RC-03'], 'Anticipacion y servicio invalido', ['Reservar fecha pasada', 'Enviar servicio fuera del catalogo'], '400 en ambos casos', async () => { const values=[]; for(const body of [{service:'Corte de cabello',date:'2020-01-01',time:'08:00'},{service:'Invalido',date,time:'08:00'}]) values.push((await request('/appointments',{token:otherToken,method:'POST',body})).status); assert.deepEqual(values,[400,400]); return {statuses:values}; });
  await check('PF-09', ['RF-11','RF-20','RF-21'], 'Aceptacion y asistencia idempotente', ['ADMIN acepta PF-06', 'CLIENT confirma dos veces', 'Comparar timestamps'], 'ACCEPTED y primera confirmacion conservada', async () => { assert.equal((await request(`/admin/appointments/${futureId}/accept`,{token:adminToken,method:'PATCH'})).status,200); const a=await request(`/appointments/${futureId}/confirm-attendance`,{token:clientToken,method:'PATCH'}); const b=await request(`/appointments/${futureId}/confirm-attendance`,{token:clientToken,method:'PATCH'}); assert.equal(a.status,200); assert.equal(b.status,200); assert.equal(a.payload.appointment.clientAttendanceConfirmedAt,b.payload.appointment.clientAttendanceConfirmedAt); return {state:a.payload.appointment.status,attendance:a.payload.appointment.attendanceStatus,idempotent:true}; });
  await check('PF-10', ['RF-09','RF-16'], 'Otro cliente no puede cancelar cita ajena', ['Otro CLIENT intenta cancelar PF-06', 'Comprobar estado almacenado'], '404 y cita ACCEPTED intacta', async()=>{ const r=await request(`/appointments/${futureId}/cancel`,{token:otherToken,method:'PATCH'}); assert.equal(r.status,404); assert.equal((await db.query('SELECT status FROM appointments WHERE id=$1',[futureId])).rows[0].status,'ACCEPTED'); return {http:r.status,unchanged:true}; });
  await check('PF-11', ['RF-09','RF-05','RF-08'], 'Cancelacion libera horario y conserva historial', ['CLIENT cancela PF-06', 'Consultar disponibilidad e historial'], 'CANCELLED y 08:00 libre', async()=>{const r=await request(`/appointments/${futureId}/cancel`,{token:clientToken,method:'PATCH'}); assert.equal(r.status,200); const availability=await request(`/appointments/availability?date=${date}`,{token:clientToken}); assert.equal(availability.payload.times.find(t=>t.time==='08:00').available,true); const list=await request('/appointments/my',{token:clientToken}); assert.equal(list.payload.appointments.find(a=>a.id===futureId).status,'CANCELLED'); return {http:r.status,state:'CANCELLED',slotReleased:true};});
  await check('PF-12', ['RF-06','RC-04'], 'Concurrencia real por el mismo horario', ['Lanzar dos POST simultaneos de clientes distintos para 10:00', 'Contar citas activas en PostgreSQL'], 'Un 201, un 409 y exactamente una cita activa', async()=>{const results=await Promise.all([clientToken,otherToken].map(token=>request('/appointments',{token,method:'POST',body:{service:'Corte de cabello',date,time:'10:00'}}))); const statuses=results.map(r=>r.status).sort(); assert.deepEqual(statuses,[201,409]); const n=(await db.query("SELECT count(*)::int AS n FROM appointments WHERE appointment_date=$1 AND appointment_time='10:00' AND status IN ('PENDING','ACCEPTED')",[date])).rows[0].n; assert.equal(n,1); await db.query("UPDATE appointments SET status='CANCELLED' WHERE appointment_date=$1 AND appointment_time='10:00'",[date]); return {statuses,active:n,requests:2};});
  await check('PF-13', ['RF-06','RC-03'], 'Concurrencia del mismo cliente y limite semanal', ['Crear dos fechas distintas dentro de siete dias', 'Intentar tercera reserva en la ventana'], 'Dos creaciones y tercer intento 409',async()=>{const dates=(await db.query("SELECT to_char((NOW() AT TIME ZONE 'America/Managua')::date + n,'YYYY-MM-DD') AS date FROM generate_series(12,14) n")).rows; const results=await Promise.all(dates.slice(0,2).map(d=>appointmentService.createAppointment({userId:otherId,service:'Corte de cabello',date:d.date,time:'11:00'}))); assert.equal(results.length,2); await assert.rejects(appointmentService.createAppointment({userId:otherId,service:'Corte de cabello',date:dates[2].date,time:'11:00'}),e=>e.statusCode===409); return {created:2,thirdRejected:true};});
  await check('PF-14', ['RF-12'], 'Rechazo administrativo libera solicitud', ['Insertar fixture PENDING', 'PATCH reject y comprobar DB'], 'REJECTED',async()=>{const id=await seedAppointment(clientId,20,'12:00','PENDING'); const r=await request(`/admin/appointments/${id}/reject`,{token:adminToken,method:'PATCH'}); assert.equal(r.status,200); assert.equal(r.payload.appointment.status,'REJECTED');return {http:r.status,state:'REJECTED'};});
  await check('PF-15', ['RF-14','RF-15'], 'Cancelacion administrativa y cierre COMPLETED', ['Intentar completar cita futura ACCEPTED', 'Cancelar cita futura', 'Completar fixture pasado ACCEPTED'], '409 o 400 para futura; CANCELLED y COMPLETED en elegibles',async()=>{const future=await seedAppointment(clientId,21,'13:00'); const blocked=await request(`/admin/appointments/${future}/complete`,{token:adminToken,method:'PATCH'}); assert.ok([400,409].includes(blocked.status)); const cancel=await request(`/admin/appointments/${future}/cancel`,{token:adminToken,method:'PATCH'}); assert.equal(cancel.payload.appointment.status,'CANCELLED'); const past=await seedAppointment(clientId,-2,'13:00'); const done=await request(`/admin/appointments/${past}/complete`,{token:adminToken,method:'PATCH'}); assert.equal(done.status,200);assert.equal(done.payload.appointment.status,'COMPLETED');return {futureBlocked:blocked.status,cancelled:true,completed:true};});
  await check('PF-16', ['RF-10','RF-13'], 'Agenda filtrada y rango invalido', ['GET agenda con rango y estado', 'Enviar rango invertido'], '200 y 400',async()=>{const a=await request(`/admin/appointments?startDate=${date}&endDate=${date}&status=CANCELLED`,{token:adminToken});const b=await request('/admin/appointments?startDate=2026-12-02&endDate=2026-12-01',{token:adminToken});assert.equal(a.status,200);assert.equal(b.status,400);return {valid:a.status,invalid:b.status};});
  await check('PF-17', ['RF-18'], 'Dispositivo idempotente y desactivacion por propietario', ['Registrar token sintetico dos veces', 'Desactivar como otro usuario', 'Desactivar como propietario'], 'Una fila; otro usuario no desactiva; propietario si',async()=>{const token='ExponentPushToken[qaParcialIII0000000000]';const body={expoPushToken:token,platform:'android'};for(let i=0;i<2;i++)assert.equal((await request('/notifications/device',{token:clientToken,method:'PUT',body})).status,200);assert.equal((await db.query('SELECT count(*)::int AS n FROM push_device_tokens WHERE user_id=$1',[clientId])).rows[0].n,1); await request('/notifications/device',{token:otherToken,method:'DELETE',body:{expoPushToken:token}});assert.equal((await db.query('SELECT active FROM push_device_tokens WHERE user_id=$1',[clientId])).rows[0].active,true);await request('/notifications/device',{token:clientToken,method:'DELETE',body:{expoPushToken:token}});assert.equal((await db.query('SELECT active FROM push_device_tokens WHERE user_id=$1',[clientId])).rows[0].active,false);return {rows:1,ownershipProtected:true,deactivated:true};});
  await check('PF-18', ['RF-22','RC-11'], 'Cola manual concurrente sin duplicados', ['Activar dispositivo sintetico sin contactar Expo', 'Dos solicitudes simultaneas de recordatorio para fixture ACCEPTED'], 'Un trabajo activo y otra solicitud rechazada',async()=>{await db.query('UPDATE push_device_tokens SET active=true WHERE user_id=$1',[clientId]); const id=await seedAppointment(clientId,23,'14:00'); const results=await Promise.allSettled([reminder.queueAppointmentAttendanceReminder(id,adminId),reminder.queueAppointmentAttendanceReminder(id,adminId)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);const n=(await db.query("SELECT count(*)::int AS n FROM appointment_notification_jobs WHERE appointment_id=$1 AND status IN ('QUEUED','CLAIMED')",[id])).rows[0].n;assert.equal(n,1);report.manualAppointment=id;return {requests:2,activeJobs:n};});
  await check('PF-19', ['RF-22','RC-11'], 'Claim, revalidacion y reintento manual reales', ['Reclamar con UUID', 'Revalidar UUID correcto e incorrecto', 'Liberar por fallo sintetico'], 'CLAIMED, solo UUID propietario valido, retorno QUEUED con backoff',async()=>{const token=crypto.randomUUID();const rows=(await db.query(`SELECT * FROM ${schema}.claim_manual_appointment_reminders($1,5)`,[token])).rows;assert.ok(rows.length>=1);const job=rows.find(r=>r.appointment_id===report.manualAppointment);assert.ok(job);assert.equal((await db.query(`SELECT ${schema}.revalidate_manual_appointment_reminder_claim($1,$2) AS ok`,[job.job_id,token])).rows[0].ok,true);assert.equal((await db.query(`SELECT ${schema}.revalidate_manual_appointment_reminder_claim($1,$2) AS ok`,[job.job_id,crypto.randomUUID()])).rows[0].ok,false);const result=(await db.query(`SELECT ${schema}.release_manual_appointment_reminder_claim($1,$2,'QA_TRANSIENT',NULL) AS state`,[job.job_id,token])).rows[0];assert.equal(result.state,'QUEUED');const row=(await db.query('SELECT attempts,available_at>clock_timestamp() AS backoff FROM appointment_notification_jobs WHERE id=$1',[job.job_id])).rows[0];assert.equal(row.attempts,1);assert.equal(row.backoff,true);return {claimed:1,wrongClaimRejected:true,state:result.state,attempts:row.attempts,backoff:true};});
  await check('PF-20', ['RF-20','RF-22','RC-11'], 'Confirmar asistencia invalida trabajos pendientes', ['Confirmar asistencia en cita del trabajo reintentable PF-19', 'Consultar trabajo'], 'SKIPPED con ATTENDANCE_ALREADY_CONFIRMED',async()=>{await appointmentService.confirmAppointmentAttendance(clientId,report.manualAppointment);const row=(await db.query('SELECT status,failure_code FROM appointment_notification_jobs WHERE appointment_id=$1',[report.manualAppointment])).rows[0];assert.equal(row.status,'SKIPPED');assert.equal(row.failure_code,'ATTENDANCE_ALREADY_CONFIRMED');return {state:row.status,reason:row.failure_code};});
  await check('PF-21', ['RF-19','RC-11'], 'Recordatorio automatico elegible y claim exclusivo', ['Insertar fixture a +40 minutos', 'Dos workers SQL reclaman simultaneamente', 'Marcar con UUID correcto'], 'Solo un worker reclama la cita; marca interna una vez',async()=>{const id=(await db.query("INSERT INTO appointments(user_id,service,appointment_date,appointment_time,status) SELECT $1,'Corte de cabello', target::date,target::time,'ACCEPTED' FROM (SELECT (clock_timestamp() AT TIME ZONE 'America/Managua')+interval '40 minutes' AS target) q RETURNING id",[clientId])).rows[0].id;const tokens=[crypto.randomUUID(),crypto.randomUUID()];const lists=await Promise.all(tokens.map(t=>db.query(`SELECT * FROM ${schema}.claim_due_appointment_reminders($1,100)`,[t])));const hits=lists.flatMap((r,i)=>r.rows.filter(x=>x.appointment_id===id).map(x=>({i,...x})));assert.equal(hits.length,1);const wrong=(await db.query(`SELECT ${schema}.mark_appointment_reminder_sent($1,$2) AS ok`,[id,crypto.randomUUID()])).rows[0].ok;assert.equal(wrong,false);const right=(await db.query(`SELECT ${schema}.mark_appointment_reminder_sent($1,$2) AS ok`,[id,tokens[hits[0].i]])).rows[0].ok;assert.equal(right,true);return {workers:2,claims:1,wrongClaimRejected:true,internalMarkedSent:true,externalDeliveryTested:false};});
  await check('PF-22', ['RC-02','RC-01'], 'Tablas sensibles no accesibles a anon', ['Consultar privilegios efectivos de anon y authenticated'], 'Sin SELECT users ni ejecucion de RPC privilegiada',async()=>{const result=(await db.query(`SELECT has_table_privilege('anon','${schema}.users','SELECT') AS anon_users, has_table_privilege('authenticated','${schema}.users','SELECT') AS authenticated_users, has_function_privilege('anon','${schema}.claim_due_appointment_reminders(uuid,integer)','EXECUTE') AS anon_claim`)).rows[0];assert.deepEqual(result,{anon_users:false,authenticated_users:false,anon_claim:false});return result;});
  await check('PF-23', ['RC-10'], 'Persistencia tras nueva conexion PostgreSQL', ['Guardar conteo e IDs sinteticos', 'Abrir conexion independiente', 'Releer registros'], 'Mismos registros visibles en nueva conexion; no equivale a redeploy',async()=>{const conn=new Client({connectionString:isolatedUrl.toString(),ssl:{rejectUnauthorized:false},connectionTimeoutMillis:15000});try{await conn.connect();const a=(await db.query('SELECT count(*)::int AS n FROM appointments')).rows[0].n;const b=(await conn.query('SELECT count(*)::int AS n FROM appointments')).rows[0].n;assert.equal(a,b);return {count:a,newConnection:true,redeployTested:false};}finally{await conn.end();}});
  await check('PF-24', ['RF-02', 'RF-16'], 'Revalidacion de identidad y rechazo de token expirado', ['GET /auth/me con CLIENT valido', 'GET con JWT expirado y JWT adulterado'], '200 con identidad publica; 401 para tokens no validos', async () => {
    const jwt = require('../backend/node_modules/jsonwebtoken');
    const valid = await request('/auth/me', { token: clientToken });
    const expired = jwt.sign({ userId: clientId, role: 'CLIENT' }, process.env.JWT_SECRET, { expiresIn: -1 });
    const statuses = [(await request('/auth/me', { token: expired })).status, (await request('/auth/me', { token: clientToken + 'invalid' })).status];
    assert.equal(valid.status, 200); assert.equal(valid.payload.user.id, clientId);
    assert.equal(valid.payload.user.password_hash, undefined); assert.deepEqual(statuses, [401, 401]);
    return { valid: 200, rejected: statuses, publicIdentity: true, deviceRestartTested: false };
  });
  await check('PF-25', ['RF-09'], 'Cancelacion en ambos lados del limite de 60 minutos', ['Preparar fixtures SQL a 60 min 30 s y 59 min 30 s', 'Cancelar mediante API como propietario'], 'La primera se cancela; la segunda se rechaza sin modificar', async () => {
    const ids = [];
    for (const seconds of [3630, 3570]) {
      ids.push((await db.query("INSERT INTO appointments(user_id,service,appointment_date,appointment_time,status) SELECT $1,'Corte de cabello',target::date,target::time,'PENDING' FROM (SELECT (clock_timestamp() AT TIME ZONE 'America/Managua') + $2 * interval '1 second' AS target) q RETURNING id", [otherId, seconds])).rows[0].id);
    }
    const statuses = [];
    for (const id of ids) statuses.push((await request(`/appointments/${id}/cancel`, { token: otherToken, method: 'PATCH' })).status);
    assert.deepEqual(statuses, [200, 400]);
    const states = (await db.query('SELECT status FROM appointments WHERE id=ANY($1::bigint[]) ORDER BY id', [ids])).rows.map(r => r.status);
    assert.deepEqual(states, ['CANCELLED', 'PENDING']);
    return { offsetsSeconds: [3630, 3570], statuses, states, exactBoundaryTested: false, fixturesBypassCreationRules: true };
  });
  await check('PF-26', ['RF-06'], 'Rollback real ante fallo de una operacion compuesta', ['BEGIN en conexion dedicada', 'Insertar cita sintetica', 'Provocar FK inexistente', 'ROLLBACK y comprobar ausencia'], 'SQLSTATE 23503 y ninguna escritura parcial', async () => {
    const conn = await db.connect(); let insertedId, failure;
    try {
      await conn.query('BEGIN');
      insertedId = (await conn.query("INSERT INTO appointments(user_id,service,appointment_date,appointment_time,status) VALUES ($1,'Corte de cabello',CURRENT_DATE+45,'17:00','PENDING') RETURNING id", [clientId])).rows[0].id;
      try { await conn.query("INSERT INTO appointments(user_id,service,appointment_date,appointment_time) VALUES (-999999,'Corte de cabello',CURRENT_DATE+46,'17:00')"); } catch (error) { failure = error.code; }
      await conn.query('ROLLBACK'); assert.equal(failure, '23503');
      assert.equal((await conn.query('SELECT count(*)::int AS n FROM appointments WHERE id=$1', [insertedId])).rows[0].n, 0);
      return { sqlState: failure, partialWrites: 0, rollback: true, scope: 'Transaccion PostgreSQL controlada; no restauracion de produccion' };
    } finally { await conn.query('ROLLBACK'); conn.release(); }
  });
  await check('PF-27', ['RF-09'], 'Limite exacto de 60 minutos con reloj transaccional', ['BEGIN en conexion dedicada', 'Preparar fixture exactamente NOW + 60 minutos', 'Ejecutar servicio real en esa conexion', 'ROLLBACK para retirar fixture'], 'Cancelacion permitida en el limite inclusivo exacto', async () => {
    const conn = await db.connect(); const originalQuery = db.query;
    try {
      await conn.query('BEGIN');
      const id = (await conn.query("INSERT INTO appointments(user_id,service,appointment_date,appointment_time,status) SELECT $1,'Corte de cabello',target::date,target::time,'PENDING' FROM (SELECT (NOW() AT TIME ZONE 'America/Managua')+interval '60 minutes' AS target) q RETURNING id", [otherId])).rows[0].id;
      // NOW is fixed by this transaction: no tolerance window or mocked clock.
      db.query = conn.query.bind(conn);
      const r = await appointmentService.cancelAppointment(otherId, id);
      assert.equal(r.status, 'CANCELLED');
      return { exactOffsetMinutes: 60, status: r.status, realPostgresql: true, transactionClock: true, httpBoundaryTested: false };
    } finally { db.query = originalQuery; await conn.query('ROLLBACK'); conn.release(); }
  });
  // Nearest-rank p95; serial requests, 15 samples per flow, warmed backend.
  for (const [name, route, options] of [
    ['login','/auth/login',{method:'POST',body:{phone:'55501981',password}}],
    ['disponibilidad',`/appointments/availability?date=${date}`,{token:clientToken}],
    ['mis_citas','/appointments/my',{token:clientToken}],
  ]) {
    await request(route,options);
    const samples=[]; const statuses=[];
    for(let i=0;i<15;i++){const start=performance.now();const r=await request(route,options);samples.push(Number((performance.now()-start).toFixed(3)));statuses.push(r.status);}
    const sorted=[...samples].sort((a,b)=>a-b);
    report.performance.push({name,samplesMs:samples,statuses,n:samples.length,concurrency:1,metric:'HTTP completo hasta JSON; incluye red a PostgreSQL; no mide feedback de UI',warmup:1,p50Ms:sorted[Math.ceil(.5*sorted.length)-1],p95Ms:sorted[Math.ceil(.95*sorted.length)-1],maxMs:sorted.at(-1),thresholdMs:1000,status:statuses.every(s=>s===200)?(sorted[Math.ceil(.95*sorted.length)-1]<=1000?'PASS':'FAIL'):'INVALID',limitations:'Muestra pequena; entorno local con DB remota; no equivale al RC-05 de interfaz ni al despliegue Render'});
    console.log(`PERF ${name} ${report.performance.at(-1).p95Ms} ms`);
  }
}
(async()=>{
  try { await main(); } catch(error) { report.infrastructureError={name:error.name,code:error.code,message:error.message.slice(0,1000)}; process.exitCode=1; }
  finally {
    if(server)await new Promise(resolve=>server.close(resolve));
    if(db)await db.end();
    try {
      await setup.query('ROLLBACK');
      if(!/^qa_iii_\d+_[a-f0-9]{6}$/.test(schema))throw new Error('Unsafe cleanup target');
      await setup.query(`DROP SCHEMA IF EXISTS ${apiSchema} CASCADE`);
      await setup.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      report.cleanup=true;
    }catch(error){report.cleanupError={code:error.code,name:error.name};process.exitCode=1;}
    await setup.end(); console.error=originalConsoleError;
    delete report.manualAppointment;
    report.finishedAt=new Date().toISOString();
    report.summary={executed:report.cases.length,passed:report.cases.filter(c=>c.status==='PASS').length,failed:report.cases.filter(c=>c.status==='FAIL').length};
    if(report.summary.failed)process.exitCode=1;
    fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({output:path.relative(root,output),...report.summary,cleanup:report.cleanup,infrastructureError:report.infrastructureError}));
  }
})();
