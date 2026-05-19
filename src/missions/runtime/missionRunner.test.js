import test from 'node:test';
import assert from 'node:assert/strict';
import { runMission } from './missionRunner.js';

const createMission = () => ({
  status: 'idle',
  tasks: [
    {
      status: 'idle',
      steps: [
        { status: 'idle', functionKey: 'first', params: { value: 1 } },
        { status: 'idle', functionKey: 'second', params: { value: 2 } },
      ],
    },
    {
      status: 'idle',
      steps: [
        { status: 'idle', functionKey: 'third', params: { value: 3 } },
      ],
    },
  ],
});

test('awaits steps in order', async () => {
  const mission = createMission();
  const calls = [];
  const stepFunctions = {
    first: async (params) => {
      calls.push(['first', params.value]);
      return true;
    },
    second: async (params) => {
      calls.push(['second', params.value]);
      return true;
    },
    third: async (params) => {
      calls.push(['third', params.value]);
      return true;
    },
  };

  await runMission(mission, stepFunctions);

  assert.deepEqual(calls, [
    ['first', 1],
    ['second', 2],
    ['third', 3],
  ]);
});

test('preserves async execution order', async () => {
  const mission = createMission();
  const calls = [];
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const stepFunctions = {
    first: async () => {
      calls.push('first:start');
      await wait(20);
      calls.push('first:end');
      return true;
    },
    second: async () => {
      calls.push('second:start');
      await wait(1);
      calls.push('second:end');
      return true;
    },
    third: async () => {
      calls.push('third:start');
      await wait(1);
      calls.push('third:end');
      return true;
    },
  };

  await runMission(mission, stepFunctions);

  assert.deepEqual(calls, [
    'first:start',
    'first:end',
    'second:start',
    'second:end',
    'third:start',
    'third:end',
  ]);
});

test('return false marks the step error and stops', async () => {
  const mission = createMission();
  const calls = [];
  const stepFunctions = {
    first: async () => {
      calls.push('first');
      return false;
    },
    second: async () => {
      calls.push('second');
      return true;
    },
    third: async () => {
      calls.push('third');
      return true;
    },
  };

  await runMission(mission, stepFunctions);

  assert.deepEqual(calls, ['first']);
  assert.equal(mission.status, 'running');
  assert.equal(mission.tasks[0].status, 'running');
  assert.equal(mission.tasks[0].steps[0].status, 'error');
  assert.equal(mission.tasks[0].steps[1].status, 'idle');
  assert.equal(mission.tasks[1].status, 'idle');
});

test('unknown functionKey marks the step error and stops', async () => {
  const mission = createMission();
  mission.tasks[0].steps[0].functionKey = 'missing';
  const calls = [];
  const stepFunctions = {
    second: async () => {
      calls.push('second');
      return true;
    },
  };

  await runMission(mission, stepFunctions);

  assert.deepEqual(calls, []);
  assert.equal(mission.tasks[0].steps[0].status, 'error');
  assert.equal(mission.tasks[0].steps[1].status, 'idle');
  assert.equal(mission.tasks[1].status, 'idle');
});

test('throw marks the step error and stops', async () => {
  const mission = createMission();
  const calls = [];
  const stepFunctions = {
    first: async () => {
      calls.push('first');
      throw new Error('boom');
    },
    second: async () => {
      calls.push('second');
      return true;
    },
  };

  await runMission(mission, stepFunctions);

  assert.deepEqual(calls, ['first']);
  assert.equal(mission.tasks[0].steps[0].status, 'error');
  assert.equal(mission.tasks[0].steps[1].status, 'idle');
});

test('marks mission done after all steps complete', async () => {
  const mission = createMission();
  const updates = [];
  const stepFunctions = {
    first: async () => true,
    second: async () => true,
    third: async () => true,
  };

  const result = await runMission(mission, stepFunctions, {
    onMissionChange: (updated) => updates.push(updated.status),
  });

  assert.equal(result, mission);
  assert.equal(mission.status, 'done');
  assert.equal(mission.currentTaskIndex, 2);
  assert.equal(mission.tasks[0].status, 'done');
  assert.equal(mission.tasks[1].status, 'done');
  assert.equal(mission.tasks[0].currentStepIndex, 2);
  assert.equal(mission.tasks[1].currentStepIndex, 1);
  assert.ok(updates.includes('running'));
  assert.equal(updates.at(-1), 'done');
});
