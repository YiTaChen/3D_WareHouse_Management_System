import test from 'node:test';
import assert from 'node:assert/strict';

import {
  degreesToRadians,
  radiansToDegrees,
  updateVectorComponent,
} from './conveyorTransform.js';

test('radiansToDegrees converts radians to rounded degrees for form inputs', () => {
  assert.equal(radiansToDegrees(Math.PI / 2), 90);
  assert.equal(radiansToDegrees(Math.PI), 180);
  assert.equal(radiansToDegrees(undefined), 0);
});

test('degreesToRadians converts degree input back to radians', () => {
  assert.equal(degreesToRadians('90'), Math.PI / 2);
  assert.equal(degreesToRadians(''), 0);
});

test('updateVectorComponent updates one coordinate without mutating the original vector', () => {
  const original = [1, 2, 3];
  const next = updateVectorComponent(original, 1, '4.5');

  assert.deepEqual(next, [1, 4.5, 3]);
  assert.deepEqual(original, [1, 2, 3]);
});
