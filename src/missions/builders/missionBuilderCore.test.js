import test from 'node:test';
import assert from 'node:assert/strict';

import { createMissionBuilders } from './missionBuilderCore.js';

const makeTemplateFunction = (missionName) => (params) => ({
  missionName,
  params,
});

const createTestBuilders = () => createMissionBuilders({
  inboundMissionConfigs: {
    Port1: {
      template: { craneId: 'crane001', steps: [{ action: 'inbound-1' }] },
      templateFunction: makeTemplateFunction('inbound-port-1'),
    },
    Port3: {
      template: { craneId: 'crane002', steps: [{ action: 'inbound-3' }] },
      templateFunction: makeTemplateFunction('inbound-port-3'),
    },
  },
  outboundMissionConfigs: {
    Port2: {
      template: { craneId: 'crane001', steps: [{ action: 'outbound-2' }] },
      templateFunction: makeTemplateFunction('outbound-port-2'),
    },
    Port5: {
      template: { craneId: 'crane003', steps: [{ action: 'outbound-5' }] },
      templateFunction: makeTemplateFunction('outbound-port-5'),
    },
  },
});

test('buildInboundMission maps inbound port configs and injects mission input', () => {
  const { buildInboundMission } = createTestBuilders();

  const mission = buildInboundMission({
    portId: 'Port3',
    boxId: 'box-1',
    shelfPosition: [1, 2, 3],
  });

  assert.equal(mission.missionName, 'inbound-port-3');
  assert.equal(mission.params.craneId, 'crane002');
  assert.equal(mission.params.boxId, 'box-1');
  assert.deepEqual(mission.params.shelfPosition, [1, 2, 3]);
});

test('buildOutboundMission maps outbound port configs and injects mission input', () => {
  const { buildOutboundMission } = createTestBuilders();

  const mission = buildOutboundMission({
    portId: 'Port5',
    boxId: 'box-2',
    shelfPosition: [4, 5, 6],
  });

  assert.equal(mission.missionName, 'outbound-port-5');
  assert.equal(mission.params.craneId, 'crane003');
  assert.equal(mission.params.boxId, 'box-2');
  assert.deepEqual(mission.params.shelfPosition, [4, 5, 6]);
});

test('buildMission deep clones the base template before calling templateFunction', () => {
  const baseTemplate = {
    craneId: 'crane001',
    nested: {
      route: ['start'],
    },
  };

  const { buildInboundMission } = createMissionBuilders({
    inboundMissionConfigs: {
      Port1: {
        template: baseTemplate,
        templateFunction: (params) => {
          params.nested.route.push('changed-by-template-function');
          return params;
        },
      },
    },
  });

  const mission = buildInboundMission({
    portId: 'Port1',
    boxId: 'box-3',
    shelfPosition: [7, 8, 9],
  });

  assert.deepEqual(baseTemplate, {
    craneId: 'crane001',
    nested: {
      route: ['start'],
    },
  });
  assert.deepEqual(mission.nested.route, ['start', 'changed-by-template-function']);
});

test('buildInboundMission rejects missing required input', () => {
  const { buildInboundMission } = createTestBuilders();

  assert.throws(
    () => buildInboundMission({ boxId: 'box-1', shelfPosition: [1, 2, 3] }),
    /inbound mission requires portId/,
  );
  assert.throws(
    () => buildInboundMission({ portId: 'Port1', shelfPosition: [1, 2, 3] }),
    /inbound mission requires boxId/,
  );
  assert.throws(
    () => buildInboundMission({ portId: 'Port1', boxId: 'box-1' }),
    /inbound mission requires shelfPosition/,
  );
});

test('buildOutboundMission rejects missing required input', () => {
  const { buildOutboundMission } = createTestBuilders();

  assert.throws(
    () => buildOutboundMission({ boxId: 'box-1', shelfPosition: [1, 2, 3] }),
    /outbound mission requires portId/,
  );
  assert.throws(
    () => buildOutboundMission({ portId: 'Port2', shelfPosition: [1, 2, 3] }),
    /outbound mission requires boxId/,
  );
  assert.throws(
    () => buildOutboundMission({ portId: 'Port2', boxId: 'box-1' }),
    /outbound mission requires shelfPosition/,
  );
});

test('mission builders reject unsupported ports', () => {
  const { buildInboundMission, buildOutboundMission } = createTestBuilders();

  assert.throws(
    () => buildInboundMission({ portId: 'Port9', boxId: 'box-1', shelfPosition: [1, 2, 3] }),
    /Unsupported inbound portId: Port9/,
  );
  assert.throws(
    () => buildOutboundMission({ portId: 'Port9', boxId: 'box-1', shelfPosition: [1, 2, 3] }),
    /Unsupported outbound portId: Port9/,
  );
});
