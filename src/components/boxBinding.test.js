import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';

import {
  applyBoxBindingTransform,
  getBoxBindingTransform,
  isPositionWithinTolerance,
  waitForBoxPosition,
} from './boxBinding.js';

test('computes the bound box target from the crane and move-table transform', () => {
  const craneState = {
    currentCranePosition: new THREE.Vector3(2, 0.8, -6),
    currentMoveTableLocalOffset: new THREE.Vector3(0, 1.3, -2),
    rotation: new THREE.Euler(0, 0, 0),
  };

  const transform = getBoxBindingTransform(craneState);

  assert.deepEqual(transform.position.toArray(), [2, 2.7, -8]);
  assert.deepEqual(transform.quaternion.toArray(), [0, 0, 0, 1]);
});

test('applies one authoritative transform and clears residual motion', () => {
  const calls = [];
  const makeSetter = (name) => ({ set: (...values) => calls.push([name, values]) });
  const boxApi = {
    position: makeSetter('position'),
    quaternion: makeSetter('quaternion'),
    velocity: makeSetter('velocity'),
    angularVelocity: makeSetter('angularVelocity'),
  };
  const transform = {
    position: new THREE.Vector3(2, 2.7, -8),
    quaternion: new THREE.Quaternion(),
  };

  assert.equal(applyBoxBindingTransform(boxApi, transform), true);
  assert.deepEqual(calls, [
    ['position', [2, 2.7, -8]],
    ['quaternion', [0, 0, 0, 1]],
    ['velocity', [0, 0, 0]],
    ['angularVelocity', [0, 0, 0]],
  ]);
});

test('position confirmation ignores stale updates and accepts the applied target', async () => {
  let listener;
  let unsubscribed = false;
  const confirmation = waitForBoxPosition({
    subscribe: (nextListener) => {
      listener = nextListener;
      return () => { unsubscribed = true; };
    },
    expectedPosition: new THREE.Vector3(2, 2.7, -8),
    timeoutMs: 100,
  });

  listener([2, 2.7, -7.5]);
  assert.equal(isPositionWithinTolerance([2, 2.7, -7.5], [2, 2.7, -8]), false);
  listener(new Float32Array([2.005, 2.7, -8]));

  assert.equal(await confirmation, true);
  assert.equal(unsubscribed, true);
});

test('position confirmation fails closed when physics never acknowledges binding', async () => {
  const confirmed = await waitForBoxPosition({
    subscribe: () => () => {},
    expectedPosition: [2, 2.7, -8],
    timeoutMs: 5,
  });

  assert.equal(confirmed, false);
});
