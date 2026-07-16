export const createTask = ({ id, name, steps }) => ({
  id,
  name,
  currentStepIndex: 0,
  status: 'pending',
  steps,
});

export const createStep = ({ id, name, functionKey, params }) => ({
  id,
  name,
  functionKey,
  params,
  status: 'pending',
});

export const conveyorMoveUntilBoxArrives = ({
  taskId,
  taskName,
  conveyorsToStart,
  conveyorsToStop,
  boxId,
  arrivalEquipmentId,
  speedSteps = [],
  waitStepId = 'step3',
  waitStepName,
  afterWaitSteps = [],
}) => createTask({
  id: taskId,
  name: taskName,
  steps: [
    ...speedSteps.map((step) => createStep(step)),
    ...conveyorsToStart.map(({ id, conveyorId, name, waitMs }) => createStep({
      id,
      name,
      functionKey: 'startConveyorRotate',
      params: {
        conveyorId,
        boxId,
        ...(waitMs === undefined ? {} : { waitMs }),
      },
    })),
    createStep({
      id: waitStepId,
      name: waitStepName,
      functionKey: 'checkBoxOnEquipment',
      params: { boxId, equipmentId: arrivalEquipmentId },
    }),
    ...afterWaitSteps.map((step) => createStep(step)),
    ...conveyorsToStop.map(({ id, conveyorId, name }) => createStep({
      id,
      name,
      functionKey: 'stopConveyorRotate',
      params: { conveyorId },
    })),
  ],
});

export const conveyorMoveToExit = conveyorMoveUntilBoxArrives;

export const craneMoveTo = ({ taskId, taskName, craneId, targetPosition, craneSpeed, stepName = 'Crane move' }) =>
  createTask({
    id: taskId,
    name: taskName,
    steps: [
      createStep({
        id: 'step1',
        name: stepName,
        functionKey: 'moveCrane',
        params: { craneName: craneId, targetPosition, speed: craneSpeed },
      }),
    ],
  });

export const craneReturnHome = ({ taskId, taskName, craneId, initCranePosition, craneSpeed }) =>
  craneMoveTo({
    taskId,
    taskName,
    craneId,
    targetPosition: initCranePosition,
    craneSpeed,
    stepName: 'Crane move back',
  });

export const cranePickFromConveyor = ({
  taskId,
  taskName,
  craneId,
  boxId,
  tableSpeed,
  movePlatePortExtendOffset,
  movePlatePortExtendAndUpOffset,
  movePlatePortUpOffset,
  movePlatePortDownOffset,
}) => createTask({
  id: taskId,
  name: taskName,
  steps: [
    createStep({
      id: 'step1',
      name: 'extend platform',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlatePortExtendOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step2',
      name: 'upward to take box',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlatePortExtendAndUpOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step3',
      name: 'Binding box',
      functionKey: 'craneBindingBox',
      params: { craneId, boxId },
    }),
    createStep({
      id: 'step4',
      name: 'collect platform',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlatePortUpOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step5',
      name: 'downward to original position',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlatePortDownOffset, speed: tableSpeed },
    }),
  ],
});

export const cranePutOnShelf = ({
  taskId,
  taskName,
  craneId,
  boxId,
  tableSpeed,
  movePlateShelfUpOffset,
  movePlateShelfExtendAndUpOffset,
  movePlateShelfExtendOffset,
  movePlateShelfDownOffset,
}) => createTask({
  id: taskId,
  name: taskName,
  steps: [
    createStep({
      id: 'step1',
      name: 'upward extend platform',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlateShelfUpOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step2',
      name: 'extend platform to shelf',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlateShelfExtendAndUpOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step3',
      name: 'Unbind box',
      functionKey: 'craneUnBindingBox',
      params: { craneId, boxId },
    }),
    createStep({
      id: 'step4',
      name: 'downward platform',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlateShelfExtendOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step5',
      name: 'collect platform',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlateShelfDownOffset, speed: tableSpeed },
    }),
    updateBoxPosition({ id: 'step6', boxId }),
  ],
});

export const cranePickFromShelf = ({
  taskId,
  taskName,
  craneId,
  boxId,
  tableSpeed,
  movePlateShelfExtendOffset,
  movePlateShelfExtendAndUpOffset,
  movePlateShelfUpOffset,
  movePlateShelfDownOffset,
}) => createTask({
  id: taskId,
  name: taskName,
  steps: [
    createStep({
      id: 'step1',
      name: 'extend platform to shelf',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlateShelfExtendOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step2',
      name: 'upward platform to take box',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlateShelfExtendAndUpOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step3',
      name: 'Binding box',
      functionKey: 'craneBindingBox',
      params: { craneId, boxId },
    }),
    createStep({
      id: 'step4',
      name: 'collect platform',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlateShelfUpOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step5',
      name: 'downward platform',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlateShelfDownOffset, speed: tableSpeed },
    }),
  ],
});

export const cranePutOnConveyor = ({
  taskId,
  taskName,
  craneId,
  boxId,
  tableSpeed,
  movePlatePortUpOffset,
  movePlatePortExtendAndUpOffset,
  movePlatePortExtendOffset,
  movePlatePortDownOffset,
}) => createTask({
  id: taskId,
  name: taskName,
  steps: [
    createStep({
      id: 'step1',
      name: 'upward platform',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlatePortUpOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step2',
      name: 'upward and extend to put box',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlatePortExtendAndUpOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step3',
      name: 'Unbind box',
      functionKey: 'craneUnBindingBox',
      params: { craneId, boxId },
    }),
    createStep({
      id: 'step4',
      name: 'downward platform',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlatePortExtendOffset, speed: tableSpeed },
    }),
    createStep({
      id: 'step5',
      name: 'collect platform',
      functionKey: 'moveCraneTable',
      params: { craneName: craneId, offset: movePlatePortDownOffset, speed: tableSpeed },
    }),
  ],
});

export const updateBoxPosition = ({ id, boxId }) => createStep({
  id,
  name: 'update box position to server',
  functionKey: 'updateBoxCurrentPositionServerHandler',
  params: { boxId },
});

export const softDeleteBoxAfterOutbound = ({ id, boxId }) => createStep({
  id,
  name: 'remove box from init position at server',
  functionKey: 'removeBoxCurrentPositionServerHandler',
  params: { boxId },
});
