import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addConveyor,
  createConveyorLayout,
  getConveyorById,
  getVisibleConveyors,
  removeConveyor,
  updateConveyor,
} from './conveyorLayout.js';

const baseConveyors = [
  { id: 'conv1', position: [0, 0, 0], rotation: [0, 0, 0], type: 'straight' },
  { id: 'conv2', position: [2, 0, 0], rotation: [0, Math.PI / 2, 0], type: 'turn' },
];

test('createConveyorLayout normalizes conveyors with isRemoved false by default', () => {
  const layout = createConveyorLayout(baseConveyors);

  assert.deepEqual(layout.map((conveyor) => conveyor.isRemoved), [false, false]);
  assert.notEqual(layout[0].position, baseConveyors[0].position);
  assert.notEqual(layout[0].rotation, baseConveyors[0].rotation);
});

test('getVisibleConveyors excludes soft-removed conveyors without deleting ids', () => {
  const layout = removeConveyor(createConveyorLayout(baseConveyors), 'conv1');

  assert.deepEqual(getVisibleConveyors(layout).map((conveyor) => conveyor.id), ['conv2']);
  assert.equal(layout.length, 2);
  assert.equal(layout.find((conveyor) => conveyor.id === 'conv1').isRemoved, true);
});

test('getConveyorById returns null for missing or removed conveyors by default', () => {
  const layout = removeConveyor(createConveyorLayout(baseConveyors), 'conv1');

  assert.equal(getConveyorById(layout, 'conv-missing'), null);
  assert.equal(getConveyorById(layout, 'conv1'), null);
  assert.equal(getConveyorById(layout, 'conv1', { includeRemoved: true }).id, 'conv1');
});

test('addConveyor creates the next stable conveyor id and default transform', () => {
  const layout = addConveyor(createConveyorLayout(baseConveyors));
  const added = layout.at(-1);

  assert.equal(added.id, 'conv3');
  assert.deepEqual(added.position, [0, 0, 0]);
  assert.deepEqual(added.rotation, [0, 0, 0]);
  assert.equal(added.type, 'straight');
  assert.equal(added.isRemoved, false);
});

test('updateConveyor changes transform fields and keeps unrelated fields intact', () => {
  const layout = updateConveyor(createConveyorLayout(baseConveyors), 'conv2', {
    position: [4, 0, 6],
    rotation: [0, Math.PI, 0],
  });
  const updated = getConveyorById(layout, 'conv2');

  assert.deepEqual(updated.position, [4, 0, 6]);
  assert.deepEqual(updated.rotation, [0, Math.PI, 0]);
  assert.equal(updated.type, 'turn');
  assert.equal(updated.isRemoved, false);
});
