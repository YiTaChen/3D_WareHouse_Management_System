// // 控制函式
// export const stepFunctions = {
//   moveCraneTable: async ({ craneName, offset, speed }) => {
//     console.log(`[移動] ${craneName} → ${offset} @${speed}`);
//     await new Promise((res) => setTimeout(res, 500)); // 模擬動畫
//     return true;
//   },
// };


import { useCraneStore } from '../stores/craneStore';
import { useBoxStore } from '../stores/boxStore';
import { useObjectBindingPosition } from '../hooks/useObjectBindingPosition';
import { useBoxEquipStore } from '../stores/boxEquipStore';
import { useConveyorStore } from '../stores/conveyorStore'




const checkBoxOnEquipment = async ({ boxId, equipmentId, tryCount = 0 }) => {
  const getEquipmentForBox = useBoxEquipStore.getState().getEquipmentForBox;

  const maxTryCount = 10;
  const tryInterval = 500;
  tryCount++;

  if (!getEquipmentForBox) {
    console.warn('[checkBoxOnEquipment] 無法取得 getEquipmentForBox');
    return false;
  }

  await new Promise((resolve) => setTimeout(resolve, tryInterval));

  const isOnEquipment = getEquipmentForBox(boxId);
  console.log(`[checkBoxOnEquipment] 嘗試 ${tryCount} 次，Boxid ${boxId} 當前在設備 ${isOnEquipment} 上`);
  if (isOnEquipment === equipmentId) {
    return true;
  } else {
    if (tryCount < maxTryCount) {
      return checkBoxOnEquipment({ boxId, equipmentId, tryCount });
    } else {
      console.warn(`[checkBoxOnEquipment] 嘗試 ${tryCount} 次後仍未找到 Box ${boxId} 在設備 ${equipmentId} 上`);
      return false;
    }
  }
};


export const stepFunctions = {



  moveCraneTable: async ({ craneName, offset, speed }) => {
    const fn = useCraneStore.getState().setMoveTableTargetLocalOffset;
    if (!fn) {
      console.warn('[moveCraneTable] 無法取得 setMoveTableTargetLocalOffset');
      return false;
    }

    // 執行動作
    fn(craneName, offset, speed);

    // 等待完成：你已經有 `isMoveTableMoving` 狀態可用來監測
    const waitUntilArrived = () =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        const maxWait = 10000;
        const tick = () => {
          const state = useCraneStore.getState().craneStates[craneName];
          if (!state || !state.isMoveTableMoving) return resolve(true);
          if (Date.now() - start > maxWait) return reject('timeout');
          requestAnimationFrame(tick);
        };
        tick();
      });

    try {
      await waitUntilArrived();
      return true;
    } catch (e) {
      console.warn(`[moveCraneTable] 等待 ${craneName} 移動完成時逾時`);
      return false;
    }
  },

  moveCrane: async ({ craneName, targetPosition, speed }) => {
    const fn = useCraneStore.getState().setCraneTargetPosition;
    if (!fn) {
      console.warn('[moveCrane] 無法取得 setCraneTargetPosition');
      return false;
    }

    // 執行動作
    fn(craneName, targetPosition, speed);

    // 等待完成：你已經有 `isMoveTableMoving` 狀態可用來監測
    const waitUntilArrived = () =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        const maxWait = 10000;
        const tick = () => {
          const state = useCraneStore.getState().craneStates[craneName];
            

          if (!state || !state.isCraneMoving) return resolve(true);
          if (Date.now() - start > maxWait) return reject('timeout');
          requestAnimationFrame(tick);
        };
        tick();
      });

    try {
      await waitUntilArrived();
      return true;
    } catch (e) {
      console.warn(`[moveCrane] 等待 ${craneName} 移動完成時逾時`);
      return false;
    }
  },

    craneBindingBox: async ({ craneId, boxId }) => {

        const bindFn = useBoxStore.getState().setBoxBoundToMoveplate;

        if (!bindFn) {
            console.warn('[craneBindingBox] 無法取得 setBoxBoundToMoveplate');
            return false;
        }

        // 執行綁定
        bindFn(boxId, craneId);

        // 模擬等待：固定等待 1 秒
        await new Promise((resolve) => setTimeout(resolve, 1000));

            return true;
    // // 等待完成：你已經有 `isMoveTableMoving` 狀態可用來監測
    // const waitUntilArrived = () =>
    //   new Promise((resolve, reject) => {
    //     const start = Date.now();
    //     const maxWait = 2000;
    //     const tick = () => {
          
    //       if (Date.now() - start > maxWait) return resolve(true);
    //       requestAnimationFrame(tick);
    //     };
    //     tick();
    //   });

    // try {
    //   await waitUntilArrived();
    //   return true;
    // } catch (e) {
    //   console.warn(`[craneBindingBox] 等待 ${craneName} 移動完成時逾時`);
    //   return false;
    // }


    },



    craneUnBindingBox: async ({ craneId, boxId }) => {

        const unbindFn = useBoxStore.getState().clearBoxBoundToMoveplate;

        if (!unbindFn) {
            console.warn('[craneBindingBox] 無法取得 clearBoxBoundToMoveplate');
            return false;
        }

        // 執行綁定
        unbindFn(boxId);

        // 模擬等待：固定等待 1 秒
        await new Promise((resolve) => setTimeout(resolve, 1000));

            return true;
    // 等待完成：你已經有 `isMoveTableMoving` 狀態可用來監測
    const waitUntilArrived = () =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        const maxWait = 2000;
        const tick = () => {
          
          if (Date.now() - start > maxWait) return resolve(true);
          requestAnimationFrame(tick);
        };
        tick();
      });

    try {
      await waitUntilArrived();
      return true;
    } catch (e) {
      console.warn(`[craneBindingBox] 等待 ${craneName} 移動完成時逾時`);
      return false;
    }


    },

    
    setCustomerConveyorRotate: async ({ conveyorId, rotate }) => {
        const setRotateFn = useConveyorStore.getState().setConveyorRotate;

        if (!setRotateFn) {
            console.warn('[setConveyorRotate] 無法取得 setConveyorRotate');
            return false;
        }

        // 執行旋轉
        setRotateFn(conveyorId, rotate);

        // 模擬等待：固定等待 1 秒
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return true;
    },

    startConveyorRotate: async ({ conveyorId }) => {
      
        // 如果 conveyorId 是 'pass'，則不執行旋轉
        if(conveyorId != 'pass' ){
          const setStartFn = useConveyorStore.getState().setConveyorRotate;

          if (!setStartFn) {
              console.warn('[startConveyorRotate] 無法取得 setConveyorRotate');
              return false;
          }

          // 執行開始旋轉
          setStartFn(conveyorId, true);
        }
        // 模擬等待：固定等待 1 秒
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return true;
    },

    stopConveyorRotate: async ({ conveyorId }) => {

        // 如果 conveyorId 是 'pass'，則不執行停止
        if(conveyorId == 'pass'){
          const setStopFn = useConveyorStore.getState().setConveyorRotate;

          if (!setStopFn) {
              console.warn('[stopConveyorRotate] 無法取得 setConveyorRotate');
              return false;
          }

          // 執行停止
          setStopFn(conveyorId, false);
        }
        // 模擬等待：固定等待 1 秒
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return true;
    },

    checkBoxOnEquipment,





    updateBoxCurrentPositionServerHandler: async ({ boxId }) => {

        const updateBoxPos = useBoxStore.getState().updateBoxCurrentPositionServer;

        if (!updateBoxPos) {
            console.warn('[craneBindingBox] 無法取得 clearBoxBoundToMoveplate');
            return false;
        }

        // 執行
        updateBoxPos(boxId);

        // 模擬等待：固定等待 1 秒
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return true;
   

    },



  }



 
  export const inboundTemplateFunction = ({
    boxId = '',
    missionName = 'Crane001 Inbound Mission',
    craneId = 'crane001',
    boxDropInitPosition = [-8, 4, -8],
    startPort = 'Port1',
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

    forceUseShelfIsTakeLeft = false

  } = {}) => {
    const upOffset = 0.3;
    const sideOffset = 2;

    const missionID = missionName.trim();

    if (forceUseShelfIsTakeLeft) {

        // 如果強制使用 shelfIsTakeLeft，則忽略傳入 postion

    }
    else {
        // 如果沒有強制使用 shelfIsTakeLeft，則根據 shelfPosition 決定
      switch (shelfPosition[2]) {
      case -8:
        shelfIsTakeLeft = true; // -8 位置強制使用左側
        break;
      case -4:
        shelfIsTakeLeft = false; // -4 位置強制使用右側
        break;
      case -2:
        shelfIsTakeLeft = true; // -2 位置強制使用左側
        break;
      case 2:
        shelfIsTakeLeft = false; // 2 位置強制使用右
        break;
      case 4:
        shelfIsTakeLeft = true; // -4 位置強制使用左側
        break;
      default:
        shelfIsTakeLeft = true; // 預設值為左側
      }
    }


    const movePlateShelfUpOffset = [0, upOffset, 0];
    const movePlateShelfDownOffset = [0, 0, 0];
    const movePlateShelfExtendOffset = shelfIsTakeLeft ? [0, 0, -sideOffset] : [0, 0, sideOffset];
    const movePlateShelfExtendAndUpOffset = shelfIsTakeLeft ? [0, upOffset, -sideOffset] : [0, upOffset, sideOffset];




    const movePlatePortUpOffset = [0, upOffset, 0];
    const movePlatePortDownOffset = [0, 0, 0];
    const movePlatePortExtendOffset = convIsTakeLeft ? [0, 0, -sideOffset] : [0, 0, sideOffset];
    const movePlatePortExtendAndUpOffset = convIsTakeLeft ? [0, upOffset, -sideOffset] : [0, upOffset, sideOffset];

    let craneShelfPosition = [0,0,0];
    craneShelfPosition[0] = shelfPosition[0];
    craneShelfPosition[1] = shelfPosition[1] -2.2 ; // crane 的 Y 軸位置比 shelf 低 1.2m

    switch (shelfPosition[2]) {
      case -8:
      case -4:
        craneShelfPosition[2] = -6; 
        break; // -8 和 -4 位置使用 -6
      case -2:
      case 2:
        craneShelfPosition[2] = -0;
        break;
      case 4:
        craneShelfPosition[2] = 6;
        break;
      default:
        craneShelfPosition[2] = 0; // 預設值
    }

    // const craneShelfPosition = shelfPosition || [-2, 2, -6];


    return {
      id: missionID.replace(/\s+/g, ''),
      name: missionName,
      currentTaskIndex: 0,
      status: 'pending',
      tasks: [
        {
          id: 'task1',
          name: '1. Port to Crane',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'conv1 conveyor rotate',
              functionKey: 'startConveyorRotate',
              params: { conveyorId: conv1st },
              status: 'pending',
            },
            {
              id: 'step2',
              name: 'conv2 conveyor rotate',
              functionKey: 'startConveyorRotate',
              params: { conveyorId: conv2nd },
              status: 'pending',
            },
            {
              id: 'step3',
              name: 'Wait Box to conv3',
              functionKey: 'checkBoxOnEquipment',
              params: { boxId: boxId, equipmentId: conv3rd },
              status: 'pending',
            },
            {
              id: 'step4',
              name: 'conv1 conveyor stop rotate',
              functionKey: 'stopConveyorRotate',
              params: { conveyorId: conv1st },
              status: 'pending',
            },
            {
              id: 'step5',
              name: 'conv2 conveyor stop rotate',
              functionKey: 'stopConveyorRotate',
              params: { conveyorId: conv2nd },
              status: 'pending',
            },
          ],
        },
        {
          id: 'task2',
          name: '2. Crane move to port',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'Crane move',
              functionKey: 'moveCrane',
              params: { craneName: craneId, targetPosition: convPortToCrane, speed: craneSpeed },
              status: 'pending',
            },
          ],
        },
        {
          id: 'task3',
          name: '3. Take Box',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'extend platform',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlatePortExtendOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step2',
              name: 'upward to take box',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlatePortExtendAndUpOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step3',
              name: 'Binding box',
              functionKey: 'craneBindingBox',
              params: { craneId: craneId, boxId: boxId },
              status: 'pending',
            },
            {
              id: 'step4',
              name: 'collect platform',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlatePortUpOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step5',
              name: 'downward to original position',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlatePortDownOffset, speed: tableSpeed },
              status: 'pending',
            },
          ],
        },
        {
          id: 'task4',
          name: '4. Crane move to Shelf',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'Crane move to shelf',
              functionKey: 'moveCrane',
              params: { craneName: craneId, targetPosition: craneShelfPosition, speed: craneSpeed }, // 保留原值
              status: 'pending',
            },
          ],
        },
        {
          id: 'task5',
          name: '5. Put Box on Shelf',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'upward extend platform',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlateShelfUpOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step2',
              name: 'extend platform to shelf',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlateShelfExtendAndUpOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step3',
              name: 'Unbind box',
              functionKey: 'craneUnBindingBox',
              params: { craneId: craneId, boxId: boxId },
              status: 'pending',
            },
            {
              id: 'step4',
              name: 'downward platform',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlateShelfExtendOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step5',
              name: 'collect platform',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlateShelfDownOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step6',
              name: 'update box position to server',
              functionKey: 'updateBoxCurrentPositionServerHandler',
              params: { boxId: boxId },
              status: 'pending',
            },
          ],
        },
        {
          id: 'task6',
          name: '6. Crane move to origin position',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'Crane move back',
              functionKey: 'moveCrane',
              params: { craneName: craneId, targetPosition: initCranePosition, speed: craneSpeed },
              status: 'pending',
            },
          ],
        },
        
      ],
    };
};


export const crane001InboundMissionParamTemplate  = {
  boxId : '',
    missionName : 'Crane001 Inbound Mission',
    craneId : 'crane001',
    boxDropInitPosition : [-8, 4, -8],
    startPort : 'Port1',
    convPortToCrane : [-4, 0, -6],
    conv1st : 'conv1',
    conv2nd : 'conv2',
    conv3rd : 'conv3',
    convIsTakeLeft : true,
    shelfIsTakeLeft : true,
    initCranePosition : [-1, 3, -6],
    craneSpeed : 6,
    tableSpeed : 1,
    shelfPosition : [6, 5, -8],

    forceUseShelfIsTakeLeft : false

  }

  

export const crane001InboundMission =  inboundTemplateFunction(crane001InboundMissionParamTemplate);


export const crane002InboundMissionParamTemplate = {
  boxId : '',
  missionName : 'Crane002 Inbound Mission',
  craneId : 'crane002',
  boxDropInitPosition : [-8, 4, 2],
  startPort : 'Port2',
  convPortToCrane : [-4, 0, 0],
  conv1st : 'conv7',
  conv2nd : 'conv8',
  conv3rd : 'conv9',
  convIsTakeLeft : false,
  shelfIsTakeLeft : true,
  initCranePosition : [-1, 3, 0],
  shelfPosition: [6, 5, 2],
  
}

export const crane002InboundMission = inboundTemplateFunction({
  boxId: '',
  missionName : 'Crane002 Inbound Mission',
  craneId : 'crane002',
  boxDropInitPosition : [-8, 4, 2],
  startPort : 'Port3',
  convPortToCrane : [-4, 0, 0],
  conv1st : 'conv7',
  conv2nd : 'conv8',
  conv3rd : 'conv9',
  convIsTakeLeft : false,
  shelfIsTakeLeft : true,
  initCranePosition : [-1, 3, 0],
  shelfPosition: [6, 5, 2],
});

export const crane003InboundMissionParamTemplate = {
  boxId : '',
  missionName : 'Crane003 Inbound Mission',
  craneId : 'crane003',
  boxDropInitPosition : [-8, 4, 8],
  startPort : 'Port4',
  convPortToCrane : [-4, 0, 6],
  conv1st : 'conv10',
  conv2nd : 'conv11',
  conv3rd : 'conv12',
  convIsTakeLeft : false,
  shelfIsTakeLeft : true,
  initCranePosition : [-1, 3, 6],
  shelfPosition: [6, 5, 4],
};

export const crane003InboundMission = inboundTemplateFunction({
  boxId : '',
  missionName : 'Crane003 Inbound Mission',
  craneId : 'crane003',
  boxDropInitPosition : [-8, 4, 8],
  startPort : 'Port4',
  convPortToCrane : [-4, 0, 6],
  conv1st : 'conv10',
  conv2nd : 'conv11',
  conv3rd : 'conv12',
  convIsTakeLeft : false,
  shelfIsTakeLeft : true,
  initCranePosition : [-1, 3, 6],
  shelfPosition: [6, 5, 4],
});




 export const outboundTemplateFunction = ({
    boxId = '',
    missionName = 'Crane001 Inbound Mission',
    craneId = 'crane001',
    boxDropInitPosition = [-8, 4, -4],
    startPort = 'Port2',
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
 
    forceUseShelfIsTakeLeft = false

  } = {}) => {
    const upOffset = 0.3;
    const sideOffset = 2;

    const missionID = missionName.trim();

    if (forceUseShelfIsTakeLeft) {

        // 如果強制使用 shelfIsTakeLeft，則忽略傳入 postion

    }
    else {
        // 如果沒有強制使用 shelfIsTakeLeft，則根據 shelfPosition 決定
        // console.log(' before shelfPosition', shelfPosition[2], 'shelfIsTakeLeft', shelfIsTakeLeft);
      switch (shelfPosition[2]) {
      case -8:
        shelfIsTakeLeft = true; // -8 位置強制使用左側
        break;
      case -4:
        shelfIsTakeLeft = false; // -4 位置強制使用右側
        break;
      case -2:
        shelfIsTakeLeft = true; // -2 位置強制使用左側
        break;
      case 2:
        shelfIsTakeLeft = false; // 2 位置強制使用右
        break;
      case 4:
        shelfIsTakeLeft = true; // -4 位置強制使用左側
        break;
      default:
        shelfIsTakeLeft = true; // 預設值為左側
      }
    }
// console.log('after shelfPosition', shelfPosition[2], 'shelfIsTakeLeft', shelfIsTakeLeft);

    const movePlateShelfUpOffset = [0, upOffset, 0];
    const movePlateShelfDownOffset = [0, 0, 0];
    const movePlateShelfExtendOffset = shelfIsTakeLeft ? [0, 0, -sideOffset] : [0, 0, sideOffset];
    const movePlateShelfExtendAndUpOffset = shelfIsTakeLeft ? [0, upOffset, -sideOffset] : [0, upOffset, sideOffset];




    const movePlatePortUpOffset = [0, upOffset, 0];
    const movePlatePortDownOffset = [0, 0, 0];
    const movePlatePortExtendOffset = convIsTakeLeft ? [0, 0, -sideOffset] : [0, 0, sideOffset];
    const movePlatePortExtendAndUpOffset = convIsTakeLeft ? [0, upOffset, -sideOffset] : [0, upOffset, sideOffset];

    let craneShelfPosition = [0,0,0];
    craneShelfPosition[0] = shelfPosition[0];
    craneShelfPosition[1] = shelfPosition[1] -2.2 ; // crane 移到的位置，會加上moveTable 的高度，先降低

    switch (shelfPosition[2]) {
      case -8:
      case -4:
        craneShelfPosition[2] = -6; 
        break; // -8 和 -4 位置使用 -6
      case -2:
      case 2:
        craneShelfPosition[2] = -0;
        break;
      case 4:
        craneShelfPosition[2] = 6;
        break;
      default:
        craneShelfPosition[2] = 0; // 預設值
    }



    return {
      id: missionID.replace(/\s+/g, ''),
      name: missionName,
      currentTaskIndex: 0,
      status: 'pending',
      tasks: [


        {
          id: 'task1',
          name: '1. Crane move to Shelf',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'Crane move to shelf',
              functionKey: 'moveCrane',
              params: { craneName: craneId, targetPosition: craneShelfPosition, speed: craneSpeed }, 
              status: 'pending',
            },
          ],
        },



         {
          id: 'task2',
          name: '2. Get Box from Shelf',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'extend platform to shelf',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlateShelfExtendOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step2',
              name: 'upward platform to take box',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlateShelfExtendAndUpOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step3',
              name: 'Binding box',
              functionKey: 'craneBindingBox',
              params: { craneId: craneId, boxId: boxId },
              status: 'pending',
            },
            {
              id: 'step4',
              name: 'collect platform',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlateShelfUpOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step5',
              name: 'downward platform',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlateShelfDownOffset, speed: tableSpeed },
              status: 'pending',
            },
          ],
        },

        {
          id: 'task3',
          name: '3. Crane move to port',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'Crane move',
              functionKey: 'moveCrane',
              params: { craneName: craneId, targetPosition: convPortToCrane, speed: craneSpeed },
              status: 'pending',
            },
          ],
        },



         {
          id: 'task4',
          name: '4. Put Box on the Conveyor',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'upward platform',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlatePortUpOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step2',
              name: 'upward and extend to put box',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlatePortExtendAndUpOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step3',
              name: 'Unbind box',
              functionKey: 'craneUnBindingBox',
              params: { craneId: craneId, boxId: boxId },
              status: 'pending',
            },
            {
              id: 'step4',
              name: 'downward platform',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlatePortExtendOffset, speed: tableSpeed },
              status: 'pending',
            },
            {
              id: 'step5',
              name: 'collect platform',
              functionKey: 'moveCraneTable',
              params: { craneName: craneId, offset: movePlatePortDownOffset, speed: tableSpeed },
              status: 'pending',
            },
          ],
        },

        {
          id: 'task5',
          name: '5. Crane move to origin position',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'Crane move back',
              functionKey: 'moveCrane',
              params: { craneName: craneId, targetPosition: initCranePosition, speed: craneSpeed },
              status: 'pending',
            },
          ],
        },


        {
          id: 'task6',
          name: '6. Move Box to exit Port',
          currentStepIndex: 0,
          status: 'pending',
          steps: [
            {
              id: 'step1',
              name: 'conv1st conveyor rotate',
              functionKey: 'startConveyorRotate',
              params: { conveyorId: conv1st },
              status: 'pending',
            },
            {
              id: 'step2',
              name: 'conv2nd conveyor rotate',
              functionKey: 'startConveyorRotate',
              params: { conveyorId: conv2nd },
              status: 'pending',
            },
            {
              id: 'step3',
              name: 'conv3rd conveyor rotate',
              functionKey: 'startConveyorRotate',
              params: { conveyorId: conv3rd },
              status: 'pending',
            },

            {
              id: 'step4',
              name: 'conv4th conveyor rotate',
              functionKey: 'startConveyorRotate',
              params: { conveyorId: conv4th },
              status: 'pending',
            },
            {
              id: 'step5',
              name: 'conv5th conveyor rotate',
              functionKey: 'startConveyorRotate',
              params: { conveyorId: conv5th },
              status: 'pending',
            },


            {
              id: 'step6',
              name: 'Wait Box to exit port',
              functionKey: 'checkBoxOnEquipment',
              params: { boxId: boxId, equipmentId: conv6th },
              status: 'pending',
            },

            {
              id: 'step6.5',
              name: 'update box position to server',
              functionKey: 'updateBoxCurrentPositionServerHandler',
              params: { boxId: boxId },
              status: 'pending',
            },

            {
              id: 'step7',
              name: 'conv1st conveyor stop rotate',
              functionKey: 'stopConveyorRotate',
              params: { conveyorId: conv1st },
              status: 'pending',
            },
            {
              id: 'step8',
              name: 'conv2nd conveyor stop rotate',
              functionKey: 'stopConveyorRotate',
              params: { conveyorId: conv2nd },
              status: 'pending',
            },
            {
              id: 'step9',
              name: 'conv3rd conveyor stop rotate',
              functionKey: 'stopConveyorRotate',
              params: { conveyorId: conv3rd },
              status: 'pending',
            },
            {
              id: 'step10',
              name: 'conv4th conveyor stop rotate',
              functionKey: 'stopConveyorRotate',
              params: { conveyorId: conv4th },
              status: 'pending',
            },
            {
              id: 'step11',
              name: 'conv5th conveyor stop rotate',
              functionKey: 'stopConveyorRotate',
              params: { conveyorId: conv5th },
              status: 'pending',
            },
          

          ],
        },
        
      ],
    };
};


export const crane001_OutboundMissionTemplate = {
  missionName: 'Crane001 Outbound Mission',
  craneId: 'crane001',
  boxDropInitPosition: [-8, 4, -4],
  startPort: 'Port2',
  convPortToCrane: [-4, 0, -6],
  conv1st: 'conv6',
  conv2nd: 'conv5',
  conv3rd: 'pass',
  conv4th: 'pass',
  conv5th: 'pass',
  conv6th: 'conv4',
  convIsTakeLeft: false,
  shelfIsTakeLeft: true,
  initCranePosition: [-1, 3, -6],
  craneSpeed: 6,
  tableSpeed: 1,
  shelfPosition: [6, 5, -4],

  forceUseShelfIsTakeLeft: false
}

export const crane001_OutboundMission = outboundTemplateFunction(crane001_OutboundMissionTemplate);


export const crane002_OutboundMissionTemplate = {
  boxId: '',
  missionName: 'Crane002 Outbound Mission',
  craneId: 'crane002',
  boxDropInitPosition: [-8, 4, 2],
  startPort: 'Port3',
  convPortToCrane: [-4, 0, 0],
  conv1st: 'conv9',
  conv2nd: 'conv8',
  conv3rd: 'pass',
  conv4th: 'pass',
  conv5th: 'pass',
  conv6th: 'conv7',
  convIsTakeLeft: false,
  shelfIsTakeLeft: false,
  initCranePosition: [-1, 3, 0],
  craneSpeed: 6,
  tableSpeed: 1,
  shelfPosition: [6, 5, 2],

  forceUseShelfIsTakeLeft: false
}

export const crane002_OutboundMission = outboundTemplateFunction(crane002_OutboundMissionTemplate);




export const crane003_OutboundMissionTemplate = {
  boxId: '',
  missionName: 'Crane003 Outbound Mission',
  craneId: 'crane003',
  boxDropInitPosition: [-8, 4, 8],
  startPort: 'Port3',
  convPortToCrane: [-4, 2, 6],
  conv1st: 'conv13',
  conv2nd: 'conv14',
  conv3rd: 'conv16',
  conv4th: 'conv17',
  conv5th: 'conv18',
  conv6th: 'conv19',
  convIsTakeLeft: false,
  shelfIsTakeLeft: true,
  initCranePosition: [-1, 3, 6],
  craneSpeed: 6,
  tableSpeed: 1,
  shelfPosition: [6, 5, 4],

  forceUseShelfIsTakeLeft: false
}

export const crane003_OutboundMission = outboundTemplateFunction(crane003_OutboundMissionTemplate);













// 任務資料（可從 JSON 載入）
export const cranePickupMission = {
  id: 'mission1',
  name: 'Crane 取貨物',
  currentTaskIndex: 0,
  status: 'pending',
  tasks: [
    {
      id: 'task1',
      name: '1. Crane move to port',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: 'Crane move',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', targetPosition: [-4, 0, -10], speed: 3 },
          status: 'pending',
        },
        
      ],
    },
    {
      id: 'task2',
      name: '2. Take Box',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: 'extend platform',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0, 2], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step2',
          name: 'upward to take box',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0.3, 2], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step3',
          name: 'Binding box',
          functionKey: 'craneBindingBox',
          params: { craneId: 'crane001', boxId: '' },
          status: 'pending',
        },
        {
          id: 'step4',
          name: 'collect platform',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0.3, 0], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step5',
          name: 'downward to original position',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0, 0], speed: 1 },
          status: 'pending',
        },
      ],
    },
    {
      id: 'task3',
      name: '3. Crane move to Shelf',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: 'Crane move to shelf',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', targetPosition: [-6, 2, -8], speed: 3 },
          status: 'pending',
        },
        
      ],
    },
    {
      id: 'task4',
      name: '4. Put Box on Shelf',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: 'upward extend platform',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0.3, 0], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step2',
          name: 'extend platform to shelf',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [-2, 0.3, 0], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step3',
          name: 'Unbind box',
          functionKey: 'craneUnBindingBox',
          params: { craneId: 'crane001', boxId: '' },
          status: 'pending',
        },
        {
          id: 'step4',
          name: 'downward platform',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [-2, 0, 0], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step5',
          name: 'collect platform',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0, 0], speed: 1 },
          status: 'pending',
        },
      ],
    },
    {
      id: 'task5',
      name: '5. Crane move to origin position',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: 'Crane move back',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', targetPosition: [0, 4, -10], speed: 3 },
          status: 'pending',
        },
        
      ],
    },

  ],
};

