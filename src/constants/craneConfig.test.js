import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

import {
  CRANE_CONSTANTS,
  getForkVisualExtensionTransform,
  writeFixedForkCraneBase,
} from './craneConfig.js';
import CraneData from '../data/CraneData.js';
import ShelfData from '../data/ShelfData.js';

const manifest = JSON.parse(
  await readFile(new URL('../../public/asrs_asset_manifest.json', import.meta.url), 'utf8')
);

test('fitted crane and fork retain clearance inside warehouse cells', () => {
  const {
    SHELF_GRID,
    BOX_SIZE,
    BODY_WIDTH_IN_CELL,
    MAST_INNER_CLEARANCE,
    FORK_OUTER_WIDTH,
    FORK_TINE_LENGTH,
  } = CRANE_CONSTANTS;

  assert.ok(BODY_WIDTH_IN_CELL < SHELF_GRID);
  assert.ok(MAST_INNER_CLEARANCE > BOX_SIZE);
  assert.ok(FORK_OUTER_WIDTH < BOX_SIZE);
  assert.ok(FORK_TINE_LENGTH > BOX_SIZE);
  assert.ok(FORK_TINE_LENGTH < manifest.fork.physics_collider_threejs_m[2]);
  assert.ok((SHELF_GRID - BODY_WIDTH_IN_CELL) / 2 >= 0.049);
  assert.ok((MAST_INNER_CLEARANCE - BOX_SIZE) / 2 >= 0.109);
  assert.equal((BOX_SIZE - FORK_OUTER_WIDTH) / 2, 0.2);
  assert.ok((manifest.fork.physics_collider_threejs_m[2] - FORK_TINE_LENGTH) / 2 >= 0.349);
});

test('manifest and runtime use the same axes and dimensions', () => {
  assert.deepEqual(manifest.warehouse_contract.axes_threejs, {
    travel: 'X',
    vertical: 'Y',
    fork: 'Z',
  });
  assert.equal(manifest.warehouse_contract.shelf_grid_m, CRANE_CONSTANTS.SHELF_GRID);
  assert.equal(manifest.fork.outer_width_m, CRANE_CONSTANTS.FORK_OUTER_WIDTH);
  assert.equal(manifest.fork.tine_length_m, CRANE_CONSTANTS.FORK_TINE_LENGTH);
  assert.equal(manifest.body.mast_inner_clearance_m, CRANE_CONSTANTS.MAST_INNER_CLEARANCE);
  assert.deepEqual(manifest.fork.physics_collider_threejs_m, [2, 0.02, 2]);
  assert.equal(manifest.fork.box_binding_vertical_offset_m, 0.6);
  assert.equal(manifest.fork.visual_contact_surface_y_m, 0.1);
  assert.equal(manifest.active_runtime_rail, 'single_guide_rail');
  assert.equal(manifest.single_guide_rail.repeat_axis_threejs, 'X');
  assert.equal(manifest.single_guide_rail.segment_length_m, 4);
  assert.equal(manifest.single_guide_rail.file, CRANE_CONSTANTS.ACTIVE_RAIL_MODEL_PATH.slice(1));
  assert.equal(manifest.single_guide_rail.runtime_active, true);
  assert.equal(manifest.rail.runtime_active, false);
  assert.equal(manifest.rail.preserved_for_future_use, true);
});

test('new visuals preserve the main branch plateTable movement contract', () => {
  assert.equal(CRANE_CONSTANTS.COLLECT_PLATE_Y_OFFSET, 0.1);
  assert.equal(CRANE_CONSTANTS.PICK_AND_PUT_Y_OFFSET, 0.15);
  assert.equal(CRANE_CONSTANTS.BOX_BINDING_VERTICAL_OFFSET, 0.6);
  assert.equal(manifest.warehouse_contract.legacy_plate_table_contract.movement_offsets_changed, false);

  CraneData.cranes.forEach((crane) => {
    assert.equal(crane.position[1], 3);
    assert.deepEqual(crane.movePlateOffset, [0, 1, 0]);
    assert.equal(crane.moveTableInitialPosition[1], 3);
    assert.deepEqual(crane.bodyColliderSize, [0.1, 0.1, 0.1]);
    assert.deepEqual(crane.moveTableColliderSize, [2, 0.02, 2]);
  });
});

test('fork contact surface matches the existing bound box bottom', () => {
  const boxBottomFromMovePlate = CRANE_CONSTANTS.BOX_BINDING_VERTICAL_OFFSET
    - CRANE_CONSTANTS.BOX_SIZE / 2;
  assert.ok(Math.abs(boxBottomFromMovePlate - manifest.fork.visual_contact_surface_y_m) < 1e-9);
});

test('inner tines stay connected to fixed guides for both extension directions', () => {
  const baseLength = CRANE_CONSTANTS.FORK_TINE_LENGTH;

  for (const extensionZ of [-2, 0, 2]) {
    const { positionZ, scaleZ } = getForkVisualExtensionTransform(extensionZ);
    const visualLength = baseLength * scaleZ;
    const nearEnd = positionZ - visualLength / 2;
    const farEnd = positionZ + visualLength / 2;

    if (extensionZ >= 0) {
      assert.ok(nearEnd <= -baseLength / 2 + 1e-9);
      assert.ok(farEnd >= extensionZ + baseLength / 2 - 1e-9);
    } else {
      assert.ok(nearEnd <= extensionZ - baseLength / 2 + 1e-9);
      assert.ok(farEnd >= baseLength / 2 - 1e-9);
    }
  }
});

test('fixed fork follows physical crane travel while preserving legacy lift Y', () => {
  const physicalTarget = {};
  assert.deepEqual(
    writeFixedForkCraneBase(
      physicalTarget,
      [8, 4.15, -6],
      { x: 7.9, y: 0, z: -6 },
    ),
    { x: 7.9, y: 4.15, z: -6 },
  );
  const fallbackTarget = {};
  assert.deepEqual(
    writeFixedForkCraneBase(fallbackTarget, [8, 4.15, -6]),
    { x: 8, y: 4.15, z: -6 },
  );
});

test('modular rail reaches beyond the final shelf cell', () => {
  const {
    RAIL_SEGMENT_CENTERS,
    RAIL_SEGMENT_LENGTH,
    SHELF_GRID,
  } = CRANE_CONSTANTS;
  const railStart = Math.min(...RAIL_SEGMENT_CENTERS) - RAIL_SEGMENT_LENGTH / 2;
  const railEnd = Math.max(...RAIL_SEGMENT_CENTERS) + RAIL_SEGMENT_LENGTH / 2;
  const lastShelfCenter = Math.max(...ShelfData.shelves.map(s => s.position[0]));
  const lastShelfOuterEdge = lastShelfCenter + SHELF_GRID / 2;

  assert.equal(railStart, -6);
  assert.equal(railEnd, 38);
  assert.ok(railEnd > lastShelfOuterEdge);
  assert.equal(manifest.single_guide_rail.segment_length_m, RAIL_SEGMENT_LENGTH);
});

test('all generated runtime assets exist and are non-empty', async () => {
  for (const asset of [
    manifest.body.file,
    manifest.fork.file,
    manifest.single_guide_rail.file,
    manifest.rail.file,
  ]) {
    const details = await stat(new URL('../../public/' + asset, import.meta.url));
    assert.ok(details.size > 1_000, asset);
  }
});

 test('mast clears a bound box at the highest storage level', () => {
  const highestShelf = Math.max(...ShelfData.shelves.map(s => s.position[1]));
  assert.ok(manifest.body.dimensions_threejs_m[1] > highestShelf + 3.4);
  assert.deepEqual(manifest.single_guide_rail.runtime_centers_x_m, CRANE_CONSTANTS.RAIL_SEGMENT_CENTERS);
 });
