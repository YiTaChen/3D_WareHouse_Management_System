// 控制函式
export const stepFunctions = {
  moveCrane: async ({ craneName, offset, speed }) => {
    console.log(`[移動] ${craneName} → ${offset} @${speed}`);
    await new Promise((res) => setTimeout(res, 500)); // 模擬動畫
    return true;
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
          params: { craneName: 'crane001', offset: [1, 0, 0], speed: 0.5 },
          status: 'pending',
        },
        {
          id: 'step2',
          name: '上升接取貨物',
          functionKey: 'moveCrane',
          params: { craneName: 'crane001', offset: [1, 0.3, 0], speed: 0.5 },
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
