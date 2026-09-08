import test from 'node:test';
import assert from 'node:assert/strict';
import { createConveyorFixture } from './conveyor-drift.mjs';
import { RUNNING_ROLLER_CONTACT } from '../../src/components/rollerContact.js';

test('main contact settings reproduce drift on an unpowered roller bed', () => {
  const fixture = createConveyorFixture({ contact: RUNNING_ROLLER_CONTACT });
  fixture.step(3);
  const start = fixture.box.position.clone();
  fixture.step(7);
  assert.ok(fixture.box.position.distanceTo(start) > .05);
});

for (const [x, yaw] of [[0, 0], [.12, 0], [-.12, 0], [0, .08], [0, .3]]) {
  test(`stopped contact settles and holds for 60 seconds: x=${x}, yaw=${yaw}`, () => {
    const fixture = createConveyorFixture({ x, yaw });
    fixture.step(10);
    const start = fixture.box.position.clone();
    fixture.step(60);
    assert.ok(fixture.box.position.distanceTo(start) < .001);
    assert.equal(fixture.box.sleepState, 2);
    assert.ok(fixture.box.position.y > 1.65);
    fixture.start();
    fixture.step(.5);
    assert.notEqual(fixture.box.sleepState, 2);
    assert.ok(fixture.box.position.x > start.x + .01, 'running roller must wake and move the box');
  });
}
