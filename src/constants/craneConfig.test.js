import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

import {
  CRANE_CONSTANTS,
  getShelfLiftRelativeOffset,
  toCraneBasePosition,
} from './craneConfig.js';

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
  assert.ok(FORK_TINE_LENGTH < BOX_SIZE);
  assert.ok((SHELF_GRID - BODY_WIDTH_IN_CELL) / 2 >= 0.099);
  assert.ok((MAST_INNER_CLEARANCE - BOX_SIZE) / 2 >= 0.109);
  assert.equal((BOX_SIZE - FORK_OUTER_WIDTH) / 2, 0.2);
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
  assert.equal(manifest.rail.repeat_axis_threejs, 'X');
  assert.equal(manifest.rail.segment_length_m, 4);
});

test('crane base remains on rail while fork lift targets shelf level', () => {
  assert.deepEqual(toCraneBasePosition([6, 5, 0]), [6, 0, 0]);
  assert.equal(getShelfLiftRelativeOffset([6, 5, 2]), 4);
});

test('all generated runtime assets exist and are non-empty', async () => {
  for (const asset of [manifest.body.file, manifest.fork.file, manifest.rail.file]) {
    const details = await stat(new URL('../../public/' + asset, import.meta.url));
    assert.ok(details.size > 1_000, asset);
  }
});
