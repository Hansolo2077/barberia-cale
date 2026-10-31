const test = require('node:test');
const assert = require('node:assert/strict');
const { gzipSync } = require('node:zlib');
const express = require('express');

test('compressed JSON with trailing bytes cannot crash the HTTP server', async () => {
  const app = express();
  app.use(express.json());
  app.post('/echo', (req, res) => res.json(req.body));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ rejected: true }));
  const server = await new Promise(resolve => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const body = gzipSync(Buffer.from('{"synthetic":true}'));
    const valid = await fetch(base + '/echo', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body,
    });
    assert.equal(valid.status, 200);
    assert.deepEqual(await valid.json(), { synthetic: true });
    const malformed = await fetch(base + '/echo', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' },
      body: Buffer.concat([body, Buffer.from('invalid-trailing-bytes')]),
    });
    assert.ok([200, 400].includes(malformed.status));
    await malformed.arrayBuffer();
    const health = await fetch(base + '/health');
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
