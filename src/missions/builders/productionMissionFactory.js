import { getCraneOperatingZ, getShelfIsTakeLeft } from '../config/shelfRules.js';
import {
  conveyorMoveToExit,
  conveyorMoveUntilBoxArrives,
  craneMoveTo,
  cranePickFromConveyor,
  cranePickFromShelf,
  cranePutOnConveyor,
  cranePutOnShelf,
  craneReturnHome,
  createStep,
  createTask,
  softDeleteBoxAfterOutbound,
  updateBoxPosition,
} from './taskBuilders.js';

const getMissionId = (missionName) => missionName.trim().replace(/\s+/g, '');

const getCraneShelfPosition = (shelfPosition) => [
  shelfPosition[0],
  shelfPosition[1] - 2.2,
  getCraneOperatingZ(shelfPosition[2], 0),
];

const getMovePlateOffsets = ({ shelfIsTakeLeft, convIsTakeLeft }) => {
  const upOffset = 0.3;
  const sideOffset = 2;

  return {
    movePlateShelfUpOffset: [0, upOffset, 0],
    movePlateShelfDownOffset: [0, 0, 0],
    movePlateShelfExtendOffset: shelfIsTakeLeft ? [0, 0, -sideOffset] : [0, 0, sideOffset],
    movePlateShelfExtendAndUpOffset: shelfIsTakeLeft ? [0, upOffset, -sideOffset] : [0, upOffset, sideOffset],
    movePlatePortUpOffset: [0, upOffset, 0],
    movePlatePortDownOffset: [0, 0, 0],
    movePlatePortExtendOffset: convIsTakeLeft ? [0, 0, -sideOffset] : [0, 0, sideOffset],
    movePlatePortExtendAndUpOffset: convIsTakeLeft ? [0, upOffset, -sideOffset] : [0, upOffset, sideOffset],
  };
};

const buildMissionShell = ({ missionName, tasks }) => ({
  id: getMissionId(missionName),
  name: missionName,
  currentTaskIndex: 0,
  status: 'pending',
  tasks,
});

const buildCrane2InboundConveyorTask = ({ boxId, conv1st, conv2nd, conv3rd }) => createTask({
  id: 'task1',
  name: '1. Port to Crane',
  steps: [
    createStep({
      id: 'step1',
      name: `${conv1st} set rotate speed positive`,
      functionKey: 'setConveyorRotateSpeedPositive',
      params: { conveyorId: conv1st },
    }),
    createStep({
      id: 'step1.5',
      name: `${conv1st} conveyor rotate`,
      functionKey: 'startConveyorRotate',
      params: { conveyorId: conv1st, boxId },
    }),
    createStep({
      id: 'step2',
      name: `${conv2nd} set rotate speed positive`,
      functionKey: 'setConveyorRotateSpeedPositive',
      params: { conveyorId: conv2nd },
    }),
    createStep({
      id: 'step2.5',
      name: `${conv2nd} conveyor rotate`,
      functionKey: 'startConveyorRotate',
      params: { conveyorId: conv2nd, boxId },
    }),
    createStep({
      id: 'step3',
      name: `${conv3rd} set rotate speed positive`,
      functionKey: 'setConveyorRotateSpeedPositive',
      params: { conveyorId: conv3rd },
    }),
    createStep({
      id: 'step3.5',
      name: 'Wait Box to exchange port',
      functionKey: 'checkBoxOnEquipment',
      params: { boxId, equipmentId: conv3rd },
    }),
    createStep({
      id: 'step4',
      name: `${conv1st} conveyor stop rotate`,
      functionKey: 'stopConveyorRotate',
      params: { conveyorId: conv1st },
    }),
    createStep({
      id: 'step5',
      name: `${conv2nd} conveyor stop rotate`,
      functionKey: 'stopConveyorRotate',
      params: { conveyorId: conv2nd },
    }),
  ],
});

const buildInboundConveyorTask = ({ boxId, conv1st, conv2nd, conv3rd, useCrane2ConveyorSequence }) => {
  if (useCrane2ConveyorSequence) {
    return buildCrane2InboundConveyorTask({ boxId, conv1st, conv2nd, conv3rd });
  }

  return conveyorMoveUntilBoxArrives({
    taskId: 'task1',
    taskName: '1. Port to Crane',
    conveyorsToStart: [
      { id: 'step1', conveyorId: conv1st, name: `${conv1st} conveyor rotate` },
      { id: 'step2', conveyorId: conv2nd, name: `${conv2nd} conveyor rotate` },
    ],
    conveyorsToStop: [
      { id: 'step4', conveyorId: conv1st, name: `${conv1st} conveyor stop rotate` },
      { id: 'step5', conveyorId: conv2nd, name: `${conv2nd} conveyor stop rotate` },
    ],
    waitStepName: `Wait Box to  ${conv3rd}`,
    boxId,
    arrivalEquipmentId: conv3rd,
  });
};

const buildCrane2OutboundConveyorTask = ({
  boxId,
  conv1st,
  conv2nd,
  conv3rd,
  conv4th,
  conv5th,
  conv6th,
}) => createTask({
  id: 'task6',
  name: '6. Move Box to exit Port',
  steps: [
    createStep({
      id: 'step1',
      name: `${conv1st}  conveyor set rotate nagetive`,
      functionKey: 'setConveyorRotateSpeedNagetive',
      params: { conveyorId: conv1st },
    }),
    createStep({
      id: 'step1.5',
      name: `${conv1st} conveyor rotate`,
      functionKey: 'startConveyorRotate',
      params: { conveyorId: conv1st, boxId },
    }),
    createStep({
      id: 'step2',
      name: `${conv2nd} conveyor set rotate nagetive`,
      functionKey: 'setConveyorRotateSpeedNagetive',
      params: { conveyorId: conv2nd },
    }),
    createStep({
      id: 'step2.5',
      name: `${conv2nd} conveyor rotate`,
      functionKey: 'startConveyorRotate',
      params: { conveyorId: conv2nd, boxId },
    }),
    createStep({
      id: 'step3',
      name: `${conv3rd} conveyor set rotate nagetive`,
      functionKey: 'setConveyorRotateSpeedNagetive',
      params: { conveyorId: conv3rd },
    }),
    createStep({
      id: 'step3.5',
      name: `${conv3rd} conveyor rotate `,
      functionKey: 'startConveyorRotate',
      params: { conveyorId: conv3rd, boxId },
    }),
    createStep({
      id: 'step4',
      name: `${conv4th} conveyor rotate`,
      functionKey: 'startConveyorRotate',
      params: { conveyorId: conv4th, boxId },
    }),
    createStep({
      id: 'step5',
      name: `${conv5th} conveyor rotate`,
      functionKey: 'startConveyorRotate',
      params: { conveyorId: conv5th, boxId },
    }),
    createStep({
      id: 'step5.1',
      name: `${conv6th} conveyor set rotate nagetive`,
      functionKey: 'setConveyorRotateSpeedNagetive',
      params: { conveyorId: conv6th },
    }),
    createStep({
      id: 'step5.5',
      name: `${conv6th} conveyor rotate`,
      functionKey: 'startConveyorRotate',
      params: { conveyorId: conv6th, boxId, waitMs: 100 },
    }),
    createStep({
      id: 'step6',
      name: 'Wait Box to exit port',
      functionKey: 'checkBoxOnEquipment',
      params: { boxId, equipmentId: conv6th },
    }),
    createStep({
      id: 'step6.1',
      name: `${conv6th} conveyor stop rotate`,
      functionKey: 'stopConveyorRotate',
      params: { conveyorId: conv6th },
    }),
    updateBoxPosition({ id: 'step6.5', boxId }),
    softDeleteBoxAfterOutbound({ id: 'step6.6', boxId }),
    createStep({
      id: 'step7',
      name: `${conv1st} conveyor stop rotate `,
      functionKey: 'stopConveyorRotate',
      params: { conveyorId: conv1st },
    }),
    createStep({
      id: 'step8',
      name: `${conv2nd} conveyor stop rotate`,
      functionKey: 'stopConveyorRotate',
      params: { conveyorId: conv2nd },
    }),
    createStep({
      id: 'step9',
      name: `${conv3rd} conveyor stop rotate`,
      functionKey: 'stopConveyorRotate',
      params: { conveyorId: conv3rd },
    }),
    createStep({
      id: 'step10',
      name: `${conv4th} conveyor stop rotate`,
      functionKey: 'stopConveyorRotate',
      params: { conveyorId: conv4th },
    }),
    createStep({
      id: 'step11',
      name: `${conv5th} conveyor set rotate nagetive`,
      functionKey: 'setConveyorRotateSpeedNagetive',
      params: { conveyorId: conv5th },
    }),
    createStep({
      id: 'step11.5',
      name: `${conv5th} conveyor stop rotate`,
      functionKey: 'stopConveyorRotate',
      params: { conveyorId: conv5th },
    }),
  ],
});

const buildOutboundConveyorTask = ({
  boxId,
  conv1st,
  conv2nd,
  conv3rd,
  conv4th,
  conv5th,
  conv6th,
  useCrane2ConveyorSequence,
}) => {
  if (useCrane2ConveyorSequence) {
    return buildCrane2OutboundConveyorTask({
      boxId,
      conv1st,
      conv2nd,
      conv3rd,
      conv4th,
      conv5th,
      conv6th,
    });
  }

  return conveyorMoveToExit({
    taskId: 'task6',
    taskName: '6. Move Box to exit Port',
    conveyorsToStart: [
      { id: 'step1', conveyorId: conv1st, name: `${conv1st} conveyor rotate` },
      { id: 'step2', conveyorId: conv2nd, name: `${conv2nd} conveyor rotate` },
      { id: 'step3', conveyorId: conv3rd, name: `${conv3rd} conveyor rotate` },
      { id: 'step4', conveyorId: conv4th, name: `${conv4th} conveyor rotate` },
      { id: 'step5', conveyorId: conv5th, name: `${conv5th} conveyor rotate` },
      { id: 'step5.5', conveyorId: conv6th, name: `${conv6th} conveyor rotate`, waitMs: 100 },
    ],
    conveyorsToStop: [
      { id: 'step7', conveyorId: conv1st, name: `${conv1st} conveyor stop rotate` },
      { id: 'step8', conveyorId: conv2nd, name: `${conv2nd} conveyor stop rotate` },
      { id: 'step9', conveyorId: conv3rd, name: `${conv3rd} conveyor stop rotate` },
      { id: 'step10', conveyorId: conv4th, name: `${conv4th} conveyor stop rotate` },
      { id: 'step11', conveyorId: conv5th, name: `${conv5th} conveyor stop rotate` },
    ],
    waitStepId: 'step6',
    waitStepName: `${conv6th} Wait Box to exit port`,
    boxId,
    arrivalEquipmentId: conv6th,
    afterWaitSteps: [
      createStep({
        id: 'step6.1',
        name: `${conv6th} conveyor stop rotate`,
        functionKey: 'stopConveyorRotate',
        params: { conveyorId: conv6th },
      }),
      updateBoxPosition({ id: 'step6.5', boxId }),
      softDeleteBoxAfterOutbound({ id: 'step6.6', boxId }),
    ],
  });
};

export const buildInboundProductionMission = ({
  boxId = '',
  missionName = 'Crane001 Inbound Mission',
  craneId = 'crane001',
  convPortToCrane = [-4, 0, -6],
  conv1st = 'conv1',
  conv2nd = 'conv2',
  conv3rd = 'conv3',
  convIsTakeLeft = true,
  shelfIsTakeLeft = true,
  initCranePosition = [-1, 3, -6],
  craneSpeed = 6,
  tableSpeed = 1,
  shelfPosition = [6, 5, -8],
  forceUseShelfIsTakeLeft = false,
  useCrane2ConveyorSequence = false,
} = {}) => {
  const resolvedShelfIsTakeLeft = forceUseShelfIsTakeLeft
    ? shelfIsTakeLeft
    : getShelfIsTakeLeft(shelfPosition[2], true);
  const offsets = getMovePlateOffsets({ shelfIsTakeLeft: resolvedShelfIsTakeLeft, convIsTakeLeft });
  const craneShelfPosition = getCraneShelfPosition(shelfPosition);

  return buildMissionShell({
    missionName,
    tasks: [
      buildInboundConveyorTask({ boxId, conv1st, conv2nd, conv3rd, useCrane2ConveyorSequence }),
      craneMoveTo({
        taskId: 'task2',
        taskName: '2. Crane move to port',
        craneId,
        targetPosition: convPortToCrane,
        craneSpeed,
      }),
      cranePickFromConveyor({
        taskId: 'task3',
        taskName: '3. Take Box',
        craneId,
        boxId,
        tableSpeed,
        ...offsets,
      }),
      craneMoveTo({
        taskId: 'task4',
        taskName: '4. Crane move to Shelf',
        craneId,
        targetPosition: craneShelfPosition,
        craneSpeed,
        stepName: 'Crane move to shelf',
      }),
      cranePutOnShelf({
        taskId: 'task5',
        taskName: '5. Put Box on Shelf',
        craneId,
        boxId,
        tableSpeed,
        ...offsets,
      }),
      craneReturnHome({
        taskId: 'task6',
        taskName: '6. Crane move to origin position',
        craneId,
        initCranePosition,
        craneSpeed,
      }),
    ],
  });
};

export const buildOutboundProductionMission = ({
  boxId = '',
  missionName = 'Crane001 Inbound Mission',
  craneId = 'crane001',
  convPortToCrane = [-4, 0, -6],
  conv1st = 'conv6',
  conv2nd = 'conv5',
  conv3rd = 'pass',
  conv4th = 'pass',
  conv5th = 'pass',
  conv6th = 'conv4',
  convIsTakeLeft = false,
  shelfIsTakeLeft = true,
  initCranePosition = [-1, 3, -6],
  craneSpeed = 6,
  tableSpeed = 1,
  shelfPosition = [6, 5, -4],
  forceUseShelfIsTakeLeft = false,
  useCrane2ConveyorSequence = false,
} = {}) => {
  const resolvedShelfIsTakeLeft = forceUseShelfIsTakeLeft
    ? shelfIsTakeLeft
    : getShelfIsTakeLeft(shelfPosition[2], true);
  const offsets = getMovePlateOffsets({ shelfIsTakeLeft: resolvedShelfIsTakeLeft, convIsTakeLeft });
  const craneShelfPosition = getCraneShelfPosition(shelfPosition);

  return buildMissionShell({
    missionName,
    tasks: [
      craneMoveTo({
        taskId: 'task1',
        taskName: '1. Crane move to Shelf',
        craneId,
        targetPosition: craneShelfPosition,
        craneSpeed,
        stepName: 'Crane move to shelf',
      }),
      cranePickFromShelf({
        taskId: 'task2',
        taskName: '2. Get Box from Shelf',
        craneId,
        boxId,
        tableSpeed,
        ...offsets,
      }),
      craneMoveTo({
        taskId: 'task3',
        taskName: '3. Crane move to port',
        craneId,
        targetPosition: convPortToCrane,
        craneSpeed,
      }),
      cranePutOnConveyor({
        taskId: 'task4',
        taskName: '4. Put Box on the Conveyor',
        craneId,
        boxId,
        tableSpeed,
        ...offsets,
      }),
      craneReturnHome({
        taskId: 'task5',
        taskName: '5. Crane move to origin position',
        craneId,
        initCranePosition,
        craneSpeed,
      }),
      buildOutboundConveyorTask({
        boxId,
        conv1st,
        conv2nd,
        conv3rd,
        conv4th,
        conv5th,
        conv6th,
        useCrane2ConveyorSequence,
      }),
    ],
  });
};
