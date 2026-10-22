const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { brotliCompressSync } = require('node:zlib');
const directory = mkdtempSync(join(tmpdir(), 'warehouse-security-'));
process.env.NODE_ENV = 'production';
process.env.DB_ENV = 'sqlite';
process.env.SQLITE_STORAGE = join(directory, 'test.sqlite');
process.env.WAREHOUSE_ADMIN_TOKEN = 'test-token-'.repeat(5);
const { createApp } = require('../index');
const database = require('../models');
const { initializeDatabase } = require('../db/initializeDatabase');
const { requireDbSwitcherAccess, requireWriteAccess, createRequestBudget } = require('../middleware/security');
let server;
let base;
const adminHeaders = { Authorization: `Bearer ${process.env.WAREHOUSE_ADMIN_TOKEN}`, 'Content-Type': 'application/json' };
const request = (path, body, method = 'POST', headers = adminHeaders) => fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });

test.before(async () => {
  await initializeDatabase();
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await database.sequelize.close();
  rmSync(directory, { recursive: true, force: true });
});
test('anonymous and incorrect-token writes fail before parsing and leave inventory untouched', async () => {
  for (const headers of [{}, { Authorization: 'Bearer incorrect' }]) {
    const response = await request('/boxes', { box_id: 'anonymous' }, 'POST', headers);
    assert.equal(response.status, 403);
  }
  const compressed = await fetch(`${base}/boxes`, { method: 'POST', headers: { 'Content-Encoding': 'br', 'Content-Type': 'application/json' }, body: brotliCompressSync(Buffer.from('{}')) });
  assert.equal(compressed.status, 403);
  assert.deepEqual(await (await fetch(`${base}/boxes`)).json(), []);
});
test('authenticated workflow works; invalid, extra, prototype and oversized values are rejected', async () => {
  assert.equal((await request('/boxes', { box_id: 'box-1' })).status, 200);
  assert.equal((await request('/boxPositions/box/box-1', { position_x: 1, position_y: 2, position_z: 3 })).status, 201);
  assert.equal((await request('/boxPositions/box/box-1', { position_x: 5 }, 'PATCH')).status, 200);
  const position = await (await fetch(`${base}/boxPositions/box/box-1`)).json();
  assert.deepEqual([position.position_x, position.position_y, position.position_z], [5, 2, 3]);
  for (const body of [{ box_id: '__proto__' }, { box_id: 'box-2', unexpected: true }, [], { box_id: { toString: 'bad' } }]) {
    assert.equal((await request('/boxes', body)).status, 400);
  }
  assert.equal((await request('/items', { item_id: 'item-1', item_name: 'valid', isAdmin: true })).status, 400);
  assert.equal((await request('/boxPositions/box/box-1', { position_x: null }, 'PATCH')).status, 400);
  assert.equal((await request('/boxContents', { box_id: 'box-1', item_id: '00001', quantity: -1 })).status, 400);
  assert.equal((await request('/boxes', { box_id: 'a'.repeat(20000) })).status, 413);
  const duplicate = await request('/boxes', { box_id: 'box-1' });
  assert.equal(duplicate.status, 400);
  assert.equal(JSON.stringify(await duplicate.json()).includes('SQLITE'), false);
  assert.equal((await request('/boxes/box-1/remove', undefined, 'PATCH')).status, 200);
});
test('authenticated compressed request is rejected without invoking Brotli decoder', async () => {
  const response = await fetch(`${base}/boxes`, { method: 'POST', headers: { ...adminHeaders, 'Content-Encoding': 'br' }, body: brotliCompressSync(Buffer.from('{"box_id":"compressed"}')) });
  assert.equal(response.status, 415);
});
test('cloud database admin cannot be enabled with spoofed Host, proxy headers or admin token', async () => {
  process.env.ENABLE_DB_SWITCHER = 'true';
  for (const path of ['/db/status', '/db/test', '/db/switch']) {
    const response = await fetch(`${base}${path}`, { method: path.endsWith('status') ? 'GET' : 'POST', headers: { ...adminHeaders, Host: 'localhost', 'X-Forwarded-For': '127.0.0.1' }, ...(path.endsWith('status') ? {} : { body: '{"type":"sqlite","storage":"/tmp/untrusted.sqlite"}' }) });
    assert.equal(response.status, 403);
  }
});
test('local DB admin requires opt-in, direct loopback and strong credential; Host alone grants nothing', () => {
  const original = { NODE_ENV: process.env.NODE_ENV, ENABLE_DB_SWITCHER: process.env.ENABLE_DB_SWITCHER };
  process.env.NODE_ENV = 'development';
  const response = () => ({ code: undefined, status(code) { this.code = code; return this; }, json() { return this; } });
  for (const [address, headers, enabled, allowed] of [
    ['203.0.113.1', { host: 'localhost', authorization: adminHeaders.Authorization }, 'true', false],
    ['127.0.0.1', { authorization: adminHeaders.Authorization, 'x-forwarded-for': '203.0.113.1' }, 'true', false],
    ['127.0.0.1', {}, 'true', false],
    ['127.0.0.1', { authorization: adminHeaders.Authorization }, 'false', false],
    ['127.0.0.1', { authorization: adminHeaders.Authorization }, 'true', true],
  ]) {
    process.env.ENABLE_DB_SWITCHER = enabled;
    let passed = false;
    const res = response();
    requireDbSwitcherAccess({ socket: { remoteAddress: address }, headers }, res, () => { passed = true; });
    assert.equal(passed, allowed);
    if (!allowed) assert.equal(res.code, 403);
  }
  Object.assign(process.env, original);
});
test('CORS allows only known demo origin and responses do not disclose database settings', async () => {
  const allowed = await fetch(`${base}/health`, { headers: { Origin: 'https://r3f-gravity-apply-test.web.app' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://r3f-gravity-apply-test.web.app');
  assert.equal(allowed.headers.get('x-powered-by'), null);
  assert.equal(allowed.headers.get('x-content-type-options'), 'nosniff');
  const denied = await fetch(`${base}/health`, { headers: { Origin: 'https://attacker.invalid' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  assert.deepEqual(Object.keys(database.getDatabaseStatus().config), ['type']);
  assert.equal(database.normalizeDatabaseRequest({ type: 'sqlite', storage: '/tmp/attacker' }).storage, 'data/warehouse.sqlite');
});
test('authenticated mutation budget is bounded and resets after its window', () => {
  let time = 0;
  const budget = createRequestBudget({ limit: 2, windowMs: 100, now: () => time });
  let passed = 0;
  const res = { set() {}, status(code) { this.code = code; return this; }, json() {} };
  for (let i = 0; i < 3; i++) budget({ method: 'POST' }, res, () => passed++);
  assert.equal(passed, 2); assert.equal(res.code, 429);
  time = 101; budget({ method: 'POST' }, res, () => passed++); assert.equal(passed, 3);
});

test('anonymous flood does not consume mutation budget and read/health requests remain available', () => {
  const budget = createRequestBudget({ limit: 2 });
  const res = { set() {}, status(code) { this.code = code; return this; }, json() {} };
  let passed = 0;
  const pipeline = req => requireWriteAccess(req, res, () => budget(req, res, () => passed++));
  for (let i = 0; i < 20; i++) pipeline({ method: 'POST', headers: {} });
  assert.equal(res.code, 403); assert.equal(passed, 0);
  pipeline({ method: 'GET', path: '/health', headers: {} });
  pipeline({ method: 'POST', headers: { authorization: adminHeaders.Authorization } });
  pipeline({ method: 'POST', headers: { authorization: adminHeaders.Authorization } });
  assert.equal(passed, 3);
  pipeline({ method: 'POST', headers: { authorization: adminHeaders.Authorization } });
  assert.equal(res.code, 429);
  pipeline({ method: 'GET', path: '/health', headers: {} });
  assert.equal(passed, 4);
});
