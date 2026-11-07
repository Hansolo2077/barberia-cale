const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const query = require('query-string');

test('router query parser preserves unicode, plus, repeated values and round trips', () => {
  const parsed = query.parse('nombre=Nu%C3%B1ez&nota=corte+barba&estado=PENDING&estado=ACCEPTED&vacio=&flag');
  assert.deepEqual({ ...parsed }, { nombre: 'Nuñez', nota: 'corte barba', estado: ['PENDING', 'ACCEPTED'], vacio: '', flag: null });
  assert.deepEqual(query.parse(query.stringify(parsed)), parsed);
  assert.equal(query.parse('hora=10%3A00&fecha=2026-11-08').hora, '10:00');
});

test('malformed URI sequences do not prevent parsing subsequent parameters', () => {
  const parsed = query.parse('bad=%zz&utf8=%E0%A4%A&ok=admin');
  assert.equal(parsed.bad, '%zz');
  assert.equal(parsed.ok, 'admin');
  assert.equal(typeof parsed.utf8, 'string');
});

test('published quadratic decoding payload finishes within a bounded isolated process', () => {
  const child = spawnSync(process.execPath, ['-e', `
    const q = require('query-string');
    let payload = '';
    for (let i=0;i<32000;i++) payload += '%' + Math.floor(i/256).toString(16).padStart(2,'0') + '%' + (i%256).toString(16).padStart(2,'0') + 'x';
    payload += '%zz';
    const output = q.parse('payload=' + payload + '&ok=1');
    if (output.ok !== '1' || typeof output.payload !== 'string') process.exit(2);
  `], { cwd: process.cwd(), timeout: 5000, encoding: 'utf8', windowsHide: true });
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr);
});
