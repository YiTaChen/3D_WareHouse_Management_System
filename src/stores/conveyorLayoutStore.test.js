import test from 'node:test';
import assert from 'node:assert/strict';

import { createConveyorLayoutStore } from './conveyorLayoutStore.js';

const baseConveyors = [
  { id: 'conv1', position: [0, 0, 0], rotation: [0, 0, 0], type: 'straight' },
  { id: 'conv2', position: [2, 0, 0], rotation: [0, Math.PI / 2, 0], type: 'turn' },
];

test('conveyor layout store starts with normalized visible conveyors', () => {
  const store = createConveyorLayoutStore(baseConveyors);
  const state = store.getState();

  assert.equal(state.selectedConveyorId, 'conv1');
  assert.deepEqual(state.getVisibleConveyors().map((conveyor) => conveyor.id), ['conv1', 'conv2']);
  assert.deepEqual(state.conveyors.map((conveyor) => conveyor.isRemoved), [false, false]);
});

test('removeConveyor soft removes conveyor and selects another visible conveyor', () => {
  const store = createConveyorLayoutStore(baseConveyors);

  store.getState().removeConveyor('conv1');

  assert.equal(store.getState().selectedConveyorId, 'conv2');
  assert.deepEqual(store.getState().getVisibleConveyors().map((conveyor) => conveyor.id), ['conv2']);
  assert.equal(store.getState().getConveyorById('conv1'), null);
  assert.equal(store.getState().getConveyorById('conv1', { includeRemoved: true }).isRemoved, true);
});

test('addConveyor creates a visible conveyor and selects it', () => {
  const store = createConveyorLayoutStore(baseConveyors);

  store.getState().addConveyor({ position: [4, 0, 0] });

  assert.equal(store.getState().selectedConveyorId, 'conv3');
  assert.deepEqual(store.getState().getConveyorById('conv3').position, [4, 0, 0]);
  assert.deepEqual(store.getState().getVisibleConveyors().map((conveyor) => conveyor.id), [
    'conv1',
    'conv2',
    'conv3',
  ]);
});

test('updateConveyor edits transform without changing runtime meaning', () => {
  const store = createConveyorLayoutStore(baseConveyors);

  store.getState().updateConveyor('conv2', {
    position: [8, 0, 8],
    rotation: [0, Math.PI, 0],
  });

  const updated = store.getState().getConveyorById('conv2');
  assert.deepEqual(updated.position, [8, 0, 8]);
  assert.deepEqual(updated.rotation, [0, Math.PI, 0]);
  assert.equal(updated.isRemoved, false);
});
