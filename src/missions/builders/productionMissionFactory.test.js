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

const withConveyorWakeBoxIds = (mission, boxId) => {
  const updatedMission = structuredClone(mission);
  updatedMission.tasks.forEach((task) => {
    task.steps.forEach((step) => {
      if (step.functionKey === 'startConveyorRotate') {
        step.params.boxId = boxId;
      }
    });
  });
  return updatedMission;
};

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
    withConveyorWakeBoxIds(inboundTemplateFunction(params), params.boxId),
  );
});

test('buildInboundProductionMission matches legacy crane2 inbound task shape', () => {
  const params = {
    ...crane002InboundMissionParamTemplate,
    ...runtimeInput,
  };

  assertSameImportantShape(
    buildInboundProductionMission({ ...params, useCrane2ConveyorSequence: true }),
    withConveyorWakeBoxIds(inboundTemplateFunctionForCrane2(params), params.boxId),
  );
});

test('buildOutboundProductionMission matches legacy outbound task shape', () => {
  const params = {
    ...crane003_OutboundMissionTemplate,
    ...runtimeInput,
  };

  assertSameImportantShape(
    buildOutboundProductionMission(params),
    withConveyorWakeBoxIds(outboundTemplateFunction(params), params.boxId),
  );
});

test('buildOutboundProductionMission matches legacy crane2 outbound task shape', () => {
  const params = {
    ...crane002_OutboundMissionTemplate,
    ...runtimeInput,
  };

  assertSameImportantShape(
    buildOutboundProductionMission({ ...params, useCrane2ConveyorSequence: true }),
    withConveyorWakeBoxIds(outboundTemplateFunctionForCrane2(params), params.boxId),
  );
});

test('outbound briefly runs and then stops the destination conveyor', () => {
  const mission = buildOutboundProductionMission({
    ...crane003_OutboundMissionTemplate,
    ...runtimeInput,
  });
  const steps = mission.tasks.find((task) => task.id === 'task6').steps;
  const startIndex = steps.findIndex(
    (step) => step.functionKey === 'startConveyorRotate' && step.params.conveyorId === 'conv19',
  );
  const waitIndex = steps.findIndex((step) => step.functionKey === 'checkBoxOnEquipment');
  const stopIndex = steps.findIndex(
    (step) => step.functionKey === 'stopConveyorRotate' && step.params.conveyorId === 'conv19',
  );

  assert.equal(steps[startIndex].params.waitMs, 100);
  assert.ok(startIndex < waitIndex);
  assert.ok(waitIndex < stopIndex);
});

test('crane2 sets the destination direction before starting it', () => {
  const mission = buildOutboundProductionMission({
    ...crane002_OutboundMissionTemplate,
    ...runtimeInput,
    useCrane2ConveyorSequence: true,
  });
  const steps = mission.tasks.find((task) => task.id === 'task6').steps;
  const speedIndex = steps.findIndex(
    (step) => step.functionKey === 'setConveyorRotateSpeedNagetive' && step.params.conveyorId === 'conv7',
  );
  const startIndex = steps.findIndex(
    (step) => step.functionKey === 'startConveyorRotate' && step.params.conveyorId === 'conv7',
  );

  assert.ok(speedIndex < startIndex);
  assert.equal(steps[startIndex].params.waitMs, 100);
});
