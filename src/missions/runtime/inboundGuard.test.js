import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMission } from './missionRunner.js';
import { useShelfStore } from '../../stores/shelfStore.js';
import { useBoxEquipStore } from '../../stores/boxEquipStore.js';

test('a loaded inbound mission is blocked before any movement if its shelf becomes occupied', async () => {
  useShelfStore.setState({ shelfStates: {} });
  useBoxEquipStore.setState({ boxCollisionStatus: {} });
  const shelf = useShelfStore.getState();
  const position = shelf.getShelfPosition('shelf001');
  shelf.assertShelfAvailable(position);
  const mission = { status: 'pending', tasks: [{ steps: [{ functionKey: 'move' }] }] };
  useBoxEquipStore.getState().setBoxCollidingWithEquipment('existing-box', 'shelf001');
  let movements = 0;
  const result = await runMission(mission, { move: () => { movements++; return true; } }, {
    beforeStart: () => shelf.assertShelfAvailable(position),
  });
  assert.equal(result.status, 'error');
  assert.match(result.error, /shelf001 is unavailable/);
  assert.equal(movements, 0);
  assert.equal(useBoxEquipStore.getState().getEquipmentForBox('existing-box'), 'shelf001');
});
