import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildInboundProductionMission,
  buildOutboundProductionMission,
} from './productionMissionFactory.js';
import {
  crane001InboundMissionParamTemplate,
  crane002InboundMissionParamTemplate,
  crane003_OutboundMissionTemplate,
  crane002_OutboundMissionTemplate,
  inboundTemplateFunction,
  inboundTemplateFunctionForCrane2,
  outboundTemplateFunction,
  outboundTemplateFunctionForCrane2,
} from '../craneMissionData.js';

const runtimeInput = {
  boxId: 'box-test',
  shelfPosition: [6, 5, 2],
};

const flattenStepFields = (mission) =>
  mission.tasks.flatMap((task) =>
    task.steps.map((step) => ({
      taskId: task.id,
      stepId: step.id,
      name: step.name,
      functionKey: step.functionKey,
      params: step.params,
    })),
  );

const assertSameImportantShape = (actual, expected) => {
  assert.equal(actual.id, expected.id);
  assert.equal(actual.name, expected.name);
  assert.equal(actual.status, expected.status);
  assert.equal(actual.currentTaskIndex, expected.currentTaskIndex);
  assert.deepEqual(
    actual.tasks.map(({ id, name, currentStepIndex, status }) => ({ id, name, currentStepIndex, status })),
    expected.tasks.map(({ id, name, currentStepIndex, status }) => ({ id, name, currentStepIndex, status })),
  );
  assert.deepEqual(flattenStepFields(actual), flattenStepFields(expected));
};

test('buildInboundProductionMission matches legacy inbound task shape', () => {
  const params = {
    ...crane001InboundMissionParamTemplate,
    ...runtimeInput,
  };

  assertSameImportantShape(
    buildInboundProductionMission(params),
    inboundTemplateFunction(params),
  );
});

test('buildInboundProductionMission matches legacy crane2 inbound task shape', () => {
  const params = {
    ...crane002InboundMissionParamTemplate,
    ...runtimeInput,
  };

  assertSameImportantShape(
    buildInboundProductionMission({ ...params, useCrane2ConveyorSequence: true }),
    inboundTemplateFunctionForCrane2(params),
  );
});

test('buildOutboundProductionMission matches legacy outbound task shape', () => {
  const params = {
    ...crane003_OutboundMissionTemplate,
    ...runtimeInput,
  };

  assertSameImportantShape(
    buildOutboundProductionMission(params),
    outboundTemplateFunction(params),
  );
});

test('buildOutboundProductionMission matches legacy crane2 outbound task shape', () => {
  const params = {
    ...crane002_OutboundMissionTemplate,
    ...runtimeInput,
  };

  assertSameImportantShape(
    buildOutboundProductionMission({ ...params, useCrane2ConveyorSequence: true }),
    outboundTemplateFunctionForCrane2(params),
  );
});
