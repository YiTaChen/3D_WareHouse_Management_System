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
};




// 任務資料（可從 JSON 載入）
export const cranePickupMission = {
  id: 'mission1',
  name: 'Crane 取貨物',
  currentTaskIndex: 0,
  status: 'pending',
  tasks: [
    {
      id: 'task1',
      name: 'Crane move to port',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: 'Crane 移動',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', targetPosition: [0, 0, -1], speed: 3 },
          status: 'pending',
        },
        
      ],
    },
    {
      id: 'task2',
      name: '取貨2',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: '伸出平台',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0, 2], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step2',
          name: '上升接取貨物',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0.3, 2], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step3',
          name: '固定box',
          functionKey: 'craneBindingBox',
          params: { craneId: 'crane001', boxId: '' },
          status: 'pending',
        },
        {
          id: 'step4',
          name: '回收平台',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0.3, 0], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step5',
          name: '下降回原位',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0, 0], speed: 1 },
          status: 'pending',
        },
      ],
    },
    {
      id: 'task3',
      name: 'Crane move to Shelf',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: 'Crane 移動',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', targetPosition: [-6, 2, -8], speed: 3 },
          status: 'pending',
        },
        
      ],
    },
    {
      id: 'task4',
      name: '放置box',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: '伸出平台',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0.3, 0], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step2',
          name: '上升接取貨物',
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
          name: '回收平台',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [-2, 0, 0], speed: 1 },
          status: 'pending',
        },
        {
          id: 'step5',
          name: '下降回原位',
          functionKey: 'moveCraneTable',
          params: { craneName: 'crane001', offset: [0, 0, 0], speed: 1 },
          status: 'pending',
        },
      ],
    },
    {
      id: 'task5',
      name: 'Crane move to origin position',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: 'Crane 移動',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', targetPosition: [0, 4, -10], speed: 3 },
          status: 'pending',
        },
        
      ],
    },






  ],
};
