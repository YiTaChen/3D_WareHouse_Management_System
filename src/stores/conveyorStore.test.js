import test from 'node:test';
import assert from 'node:assert/strict';

import { useConveyorStore } from './conveyorStore.js';

test('getConveyorState returns a stable default state for unknown conveyors', () => {
  const firstState = useConveyorStore.getState().getConveyorState('conv-not-yet-created');
  const secondState = useConveyorStore.getState().getConveyorState('conv-not-yet-created');

  assert.equal(firstState, secondState);
  assert.deepEqual(firstState, {
    rotate: false,
    speed: -20,
    BulkSensorDetected: false,
    sensor1Detected: false,
    sensor2Detected: false,
    lightColor: '#808080',
  });
});

test('runtime actions create conveyor state for dynamically added conveyors', () => {
  useConveyorStore.getState().setConveyorRotate('conv-dynamic', true);
  useConveyorStore.getState().setConveyorSpeed('conv-dynamic', -12);

  const dynamicState = useConveyorStore.getState().getConveyorState('conv-dynamic');

  assert.equal(dynamicState.rotate, true);
  assert.equal(dynamicState.speed, -12);
  assert.notEqual(dynamicState, useConveyorStore.getState().getConveyorState('conv-never-created'));
});
