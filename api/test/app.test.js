'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { createApp } = require('../src/app');

function fakeDb(handler) {
  const calls = [];
  return { calls, query: async (text, params) => { calls.push({ text, params }); return handler(text, params); } };
}

async function request(app, method, path, body) {
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, json: await res.json() };
  } finally {
    server.close();
  }
}

test('GET /healthz is 200 and does not hit the database', async () => {
  const db = fakeDb(() => { throw new Error('should not be called'); });
  const r = await request(createApp({ db }), 'GET', '/healthz');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(db.calls.length, 0);
});

test('GET /api/health reports db up and instance meta', async () => {
  const db = fakeDb(() => ({ rows: [{}] }));
  const r = await request(createApp({ db, meta: { hostname: 'h1' } }), 'GET', '/api/health');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.json.database, 'up');
  assert.strictEqual(r.json.instance.hostname, 'h1');
});

test('GET /api/health returns 503 when db is down', async () => {
  const db = fakeDb(() => { throw new Error('boom'); });
  const r = await request(createApp({ db }), 'GET', '/api/health');
  assert.strictEqual(r.status, 503);
  assert.strictEqual(r.json.database, 'down');
});

test('POST /api/subscribe rejects invalid email', async () => {
  const db = fakeDb(() => ({ rows: [] }));
  const r = await request(createApp({ db }), 'POST', '/api/subscribe', { email: 'nope' });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(db.calls.length, 0);
});

test('POST /api/subscribe stores a normalised email (parameterised query)', async () => {
  const db = fakeDb(() => ({ rows: [{ id: 1 }] }));
  const r = await request(createApp({ db }), 'POST', '/api/subscribe', { email: ' Foo@Bar.COM ' });
  assert.strictEqual(r.status, 201);
  assert.deepStrictEqual(db.calls[0].params, ['foo@bar.com']);
});

test('POST /api/subscribe is idempotent for existing subscribers', async () => {
  const db = fakeDb(() => ({ rows: [] }));
  const r = await request(createApp({ db }), 'POST', '/api/subscribe', { email: 'a@b.co' });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.json.alreadySubscribed, true);
});

test('POST /api/contact validates input', async () => {
  const db = fakeDb(() => ({ rows: [] }));
  const r = await request(createApp({ db }), 'POST', '/api/contact', { name: '', email: 'a@b.co', message: 'hi' });
  assert.strictEqual(r.status, 400);
});

test('POST /api/contact saves and copies to storage', async () => {
  const db = fakeDb(() => ({ rows: [{ id: 7, created_at: 'now' }] }));
  const stored = [];
  const storage = { putJson: async (k, o) => { stored.push([k, o]); } };
  const r = await request(createApp({ db, storage }), 'POST', '/api/contact',
    { name: 'Ada', email: 'ada@x.io', message: 'Hello' });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.json.id, 7);
  assert.strictEqual(stored[0][0], 'contacts/7.json');
});

test('DB failure on subscribe returns 500 without leaking details', async () => {
  const db = fakeDb(() => { throw new Error('secret internal detail'); });
  const r = await request(createApp({ db }), 'POST', '/api/subscribe', { email: 'a@b.co' });
  assert.strictEqual(r.status, 500);
  assert.ok(!JSON.stringify(r.json).includes('secret'));
});

test('unknown /api route is 404 JSON', async () => {
  const r = await request(createApp({ db: fakeDb(() => ({ rows: [] })) }), 'GET', '/api/nope');
  assert.strictEqual(r.status, 404);
});
