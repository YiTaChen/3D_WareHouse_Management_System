import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { useShelfStore } from './shelfStore.js';
import { useBoxEquipStore } from './boxEquipStore.js';

beforeEach(() => {
  useShelfStore.setState({ shelfStates: {} });
  useBoxEquipStore.setState({ boxCollisionStatus: {} });
});

const available = () => useShelfStore.getState().getEmptyShelfListByZ([-8]);

test('inbound destination disappears when occupied and returns after outbound', () => {
  const shelf = useShelfStore.getState();
  const equipment = useBoxEquipStore.getState();
  assert.ok(available().some(s => s.id === 'shelf001'));
  shelf.setShelfSensorDetected('shelf001', 'BulkSensorDetected', true);
  equipment.setBoxCollidingWithEquipment('box1', 'shelf001');
  assert.ok(!available().some(s => s.id === 'shelf001'));
  assert.throws(() => shelf.assertShelfAvailable(shelf.getShelfPosition('shelf001')), /unavailable/);
  // Sleeping bodies can end sensor contact while still stored on the shelf.
  shelf.setShelfSensorDetected('shelf001', 'BulkSensorDetected', false);
  assert.ok(!available().some(s => s.id === 'shelf001'));
  assert.ok(!shelf.getEmptyShelfListPort1().some(s => s.id === 'shelf001'));
  equipment.setBoxCollidingWithEquipment('box1', 'crane001');
  assert.ok(available().some(s => s.id === 'shelf001'));
  assert.equal(shelf.assertShelfAvailable(shelf.getShelfPosition('shelf001')), 'shelf001');
});

test('sensor-only occupancy and each remaining box prevent reuse', () => {
  const shelf = useShelfStore.getState();
  shelf.setShelfSensorDetected('shelf001', 'BulkSensorDetected', true);
  assert.equal(shelf.isShelfAvailable('shelf001'), false);
  shelf.setShelfSensorDetected('shelf001', 'BulkSensorDetected', false);
  useBoxEquipStore.setState({ boxCollisionStatus: { a: 'shelf001', b: 'shelf001' } });
  useBoxEquipStore.getState().clearBoxCollision('a');
  assert.equal(shelf.isShelfAvailable('shelf001'), false);
  useBoxEquipStore.getState().clearBoxCollision('b');
  assert.equal(shelf.isShelfAvailable('shelf001'), true);
});

test('invalid destinations are rejected and other rows remain available', () => {
  const shelf = useShelfStore.getState();
  assert.throws(() => shelf.assertShelfAvailable(undefined), /unavailable/);
  assert.throws(() => shelf.assertShelfAvailable([999, 3, -8]), /unavailable/);
  useBoxEquipStore.getState().setBoxCollidingWithEquipment('box1', 'shelf090');
  assert.ok(!available().some(s => s.id === 'shelf090'));
  assert.equal(available().length, 89);
  assert.equal(shelf.getEmptyShelfListByZ([-4]).length, 90);
});
