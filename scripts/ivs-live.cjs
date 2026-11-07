/* Read-only smoke and bounded availability observation. Never logs credentials,
 * tokens, names, phones or appointment payloads. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const base = 'https://barberia-cale.onrender.com/api';
const accounts = JSON.parse(fs.readFileSync(path.join(root, '.quality-private/ivs-evaluation-access.json'), 'utf8')).accounts;
const out = path.resolve(process.argv[2] || 'docs/evidencias_pruebas/ivs-2026-11-07/despliegue.json');
const report = { startedAt: new Date().toISOString(), executor: 'Codex con autorizacion de Hanssel', base, deployedCommit: 'No identificado por endpoint; no se presume que sea el checkout local', mutations: false, checks: [], availability: [] };
async function call(route, token, body) {
  const start = performance.now();
  const r = await fetch(base + route, { method: body ? 'POST' : 'GET', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
  const data = await r.json(); return { http: r.status, data, ms: Math.round(performance.now() - start) };
}
(async () => {
  try {
    const tokens = {};
    for (const role of ['CLIENT', 'ADMIN']) {
      const account = accounts.find(a => a.role === role);
      const r = await call('/auth/login', null, { phone: account.phone, password: account.password });
      const passed = r.http === 200 && r.data.user?.role === role;
      report.checks.push({ id: `IVS-LOGIN-${role}`, expected: `200 y rol ${role}`, http: r.http, returnedRole: r.data.user?.role, status: passed ? 'PASS' : 'FAIL', ms: r.ms });
      if (passed) tokens[role] = r.data.token;
    }
    for (const [id, route, token, expected] of [
      ['IVS-ROLE-01', '/admin/appointments', undefined, 401],
      ['IVS-ROLE-02', '/admin/appointments', 'invalid', 401],
      ...(tokens.CLIENT ? [['IVS-ROLE-03', '/admin/appointments', tokens.CLIENT, 403], ['IVS-ME-CLIENT', '/auth/me', tokens.CLIENT, 200], ['IVS-MY', '/appointments/my', tokens.CLIENT, 200]] : []),
      ...(tokens.ADMIN ? [['IVS-ROLE-04', '/appointments/my', tokens.ADMIN, 403], ['IVS-ME-ADMIN', '/auth/me', tokens.ADMIN, 200], ['IVS-ADMIN', '/admin/appointments', tokens.ADMIN, 200]] : []),
    ]) {
      const r = await call(route, token);
      report.checks.push({ id, route, expected, http: r.http, status: r.http === expected ? 'PASS' : 'FAIL', ms: r.ms });
    }
    // Six serial observations, separated by ten seconds. No SLA inference.
    for (let i = 0; i < 6; i++) {
      const observedAt = new Date().toISOString();
      try { const r = await call('/health'); report.availability.push({ observedAt, http: r.http, ms: r.ms, ok: r.http === 200 }); }
      catch { report.availability.push({ observedAt, ok: false, error: 'No respuesta HTTP valida' }); }
      if (i < 5) await new Promise(resolve => setTimeout(resolve, 10000));
    }
    report.availabilitySummary = { samples: report.availability.length, successful: report.availability.filter(x => x.ok).length, observationOnly: true, limitations: 'Muestra puntual de unos 50 segundos mas latencia; /health no verifica DB. No mide SLA, disponibilidad mensual ni carga. Los checks autenticados se registran por separado.' };
  } catch { report.error = 'Fallo de red o acceso; cuerpos y secretos omitidos'; }
  finally {
    report.finishedAt = new Date().toISOString();
    report.status = !report.error && report.checks.length === 10 && report.checks.every(x => x.status === 'PASS') && report.availability.every(x => x.ok) ? 'PASS' : 'INCOMPLETE_OR_FAIL';
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, checks: report.checks, availability: report.availabilitySummary }));
    if (report.status !== 'PASS') process.exitCode = 1;
  }
})();
