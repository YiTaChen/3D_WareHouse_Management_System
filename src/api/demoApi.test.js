import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoApi } from './demoApi.js';

const products = [{ item_id: '00001', item_name: 'Cola', category: 'Soft-Drink' }];
const mutate = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('public demo preserves create, inventory, move, cleanup and independent visitor sessions', async () => {
  const api = createDemoApi({ products });
  const otherVisitor = createDemoApi({ products });
  assert.deepEqual(await (await api('/boxPositions/mapFullData')).json(), {});
  assert.equal((await api('/boxes', mutate('POST', { box_id: 'box-1' }))).status, 201);
  assert.equal((await api('/boxPositions/box/box-1', mutate('POST', { position_x: 1, position_y: 3, position_z: 2 }))).status, 201);
  assert.equal((await api('/boxContents', mutate('POST', { box_id: 'box-1', item_id: '00001', quantity: 4 }))).status, 201);
  let inventory = await (await api('/boxInventory/fullData')).json();
  assert.deepEqual(inventory[0].position, [1, 3, 2]);
  assert.equal(inventory[0].content['00001'].quantity, 4);
  await api('/boxPositions/box/box-1', mutate('PATCH', { position_x: 9, position_y: 4, position_z: 7 }));
  inventory = await (await api('/boxInventory/fullData')).json();
  assert.deepEqual(inventory[0].position, [9, 4, 7]);
  assert.deepEqual(await (await otherVisitor('/boxInventory/fullData')).json(), []);
  await api('/boxes/box-1/remove', { method: 'PATCH' });
  assert.deepEqual(await (await api('/boxPositions/mapFullData')).json(), {});
  assert.equal((await api('/db/switch', mutate('POST', { type: 'sqlite' }))).status, 404);
});
test('demo limits allocations and rejects invalid mutations', async () => {
  const api = createDemoApi({ products, maxBoxes: 1 });
  await api('/boxes', mutate('POST', { box_id: 'box-1' }));
  assert.equal((await api('/boxes', mutate('POST', { box_id: 'box-2' }))).status, 429);
  assert.equal((await api('/boxes', mutate('POST', { box_id: '<script>' }))).status, 400);
  assert.equal((await api('/boxContents', mutate('POST', { box_id: 'box-1', item_id: '00001', quantity: -1 }))).status, 400);
  assert.equal((await api('/boxPositions/box/box-1', mutate('PATCH', { position_x: 'bad' }))).status, 400);
});

test('actual box store never publishes a box if create, position, content or demo capacity is rejected', async (t) => {
  t.mock.method(console, 'error', () => {});
  const { createServer } = await import('vite');
  const vite = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { useBoxStore } = await vite.ssrLoadModule('/src/stores/boxStore.js');
    const add = (id, position, content) => useBoxStore.getState().addBox(id, { id, position, content });
    useBoxStore.setState({ boxesData: {} });
    assert.equal(await add('<invalid>', [1, 2, 3]), false);
    assert.equal(await add('bad-position', [NaN, 2, 3]), false);
    assert.equal(await add('bad-content', [1, 2, 3], { bad: { id: 'unknown', quantity: 1 } }), false);
    assert.deepEqual(useBoxStore.getState().boxesData, {});
    await add('valid-box', [1, 2, 3], { cola: { id: '00001', quantity: 1 } });
    assert.equal(useBoxStore.getState().boxesData['valid-box'].id, 'valid-box');
    const { apiFetch } = await vite.ssrLoadModule('/src/api/client.js');
    let limitReached = false;
    for (let i = 0; i < 1005; i++) {
      if ((await apiFetch('/boxes', mutate('POST', { box_id: `fill-${i}` }))).status === 429) { limitReached = true; break; }
    }
    assert.equal(limitReached, true);
    assert.equal(await add('capped-box', [1, 2, 3]), false);
    assert.deepEqual(Object.keys(useBoxStore.getState().boxesData), ['valid-box']);
  } finally { await vite.close(); }
});
