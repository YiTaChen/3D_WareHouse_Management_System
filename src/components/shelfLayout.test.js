import assert from 'node:assert/strict';
import test from 'node:test';
import { ShelfData } from '../data/ShelfData.js';
import {
  createShelfRows,
  getNearestShelfInRow,
  getShelfRowBody,
} from './shelfLayout.js';

test('creates the 18 x 5 x 5 shelf layout', () => {
  const xPositions = new Set(ShelfData.shelves.map((shelf) => shelf.position[0]));
  const yPositions = new Set(ShelfData.shelves.map((shelf) => shelf.position[1]));
  const zPositions = new Set(ShelfData.shelves.map((shelf) => shelf.position[2]));

  assert.equal(ShelfData.shelves.length, 450);
  assert.deepEqual([...xPositions], Array.from({ length: 18 }, (_, index) => index * 2 + 2));
  assert.deepEqual([...yPositions], [0, 2, 4, 6, 8]);
  assert.deepEqual([...zPositions], [-8, -4, -2, 2, 4]);
});

test('aggregates shelf physics into 25 rows', () => {
  const rows = createShelfRows(ShelfData.shelves);

  assert.equal(rows.length, 25);
  assert.ok(rows.every((row) => row.shelves.length === 18));
});

test('preserves exact shelf ids at both ends of an aggregated row', () => {
  const row = createShelfRows(ShelfData.shelves)
    .find((candidate) => candidate.y === 8 && candidate.z === -8);

  assert.equal(getNearestShelfInRow(row, 2).id, 'shelf073');
  assert.equal(getNearestShelfInRow(row, 36).id, 'shelf090');
});

test('builds one continuous 36-unit table body for an 18-shelf row', () => {
  const row = createShelfRows(ShelfData.shelves)[0];
  const body = getShelfRowBody(row, {
    position: [0, 2, 0],
    rotation: [0, 0, 0],
    args: [2, 0.02, 2],
  });

  assert.deepEqual(body.position, [19, 2, -8]);
  assert.deepEqual(body.args, [36, 0.02, 2]);
});
