// // 控制函式
// export const stepFunctions = {
//   moveCrane: async ({ craneName, offset, speed }) => {
//     console.log(`[移動] ${craneName} → ${offset} @${speed}`);
//     await new Promise((res) => setTimeout(res, 500)); // 模擬動畫
//     return true;
//   },
// };


import { useCraneStore } from '../stores/craneStore';

export const stepFunctions = {
  moveCrane: async ({ craneName, offset, speed }) => {
    const fn = useCraneStore.getState().setMoveTableTargetLocalOffset;
    if (!fn) {
      console.warn('[moveCrane] 無法取得 setMoveTableTargetLocalOffset');
      return false;
    }

    // 執行動作
    fn(craneName, offset, speed);

    // 等待完成：你已經有 `isMoveTableMoving` 狀態可用來監測
    const waitUntilArrived = () =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        const maxWait = 5000;
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
      console.warn(`[moveCrane] 等待 ${craneName} 移動完成時逾時`);
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
      name: '取貨',
      currentStepIndex: 0,
      status: 'pending',
      steps: [
        {
          id: 'step1',
          name: '伸出平台',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', offset: [2, 0, 0], speed: 0.5 },
          status: 'pending',
        },
        {
          id: 'step2',
          name: '上升接取貨物',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', offset: [2, 0.3, 0], speed: 0.5 },
          status: 'pending',
        },
        {
          id: 'step3',
          name: '回收平台',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', offset: [0, 0.3, 0], speed: 0.5 },
          status: 'pending',
        },
        {
          id: 'step4',
          name: '下降回原位',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', offset: [0, 0, 0], speed: 0.5 },
          status: 'pending',
        },
      ],
    },
  ],
};
