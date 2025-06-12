import { create } from 'zustand';
// 假設你有一個 CraneData.js 包含貨架的配置
// import CraneData from '../data/CraneData'; // 如果有需要，可以引入貨架數據

const initializeCraneStates = () => {
  const craneStates = {};
  // 這裡可以根據你的 CraneData 來初始化多個貨架的狀態
  // 例如，如果每個貨架有唯一的 ID，可以這樣做
  // CraneData.shelves.forEach(crane => {
  //   craneStates[crane.id] = {
  //     BulkSensorDetected: false,
  //     // 其他可能狀態，例如每個層板的狀態
  //   };
  // });

  // 暫時為單個貨架設置一個預設狀態，你可以根據實際 CraneData 調整
  craneStates['crane_ver1'] = { // 使用你的 GLTF 模型名或一個唯一的 ID
    BulkSensorDetected: false,
    // 這裡可以擴展為每個層板或區域的感測器狀態，例如:
    // craneLayer1Occupied: false,
    // craneLayer2Occupied: false,
  };
  return craneStates;
};

export const useCraneStore = create((set, get) => ({
  craneStates: initializeCraneStates(),

  /**
   * 設定指定貨架的感應器狀態
   * @param {string} id - 貨架的 ID (例如 'crane_ver1')
   * @param {string} sensorKey - 感應器的鍵 (例如 'BulkSensorDetected' 或 'craneLayer1Occupied')
   * @param {boolean} detected - 是否檢測到物體
   */
  setCraneSensorDetected: (id, sensorKey, detected) => {
    set((state) => ({
      craneStates: {
        ...state.craneStates,
        [id]: {
          ...state.craneStates[id],
          [sensorKey]: detected,
        },
      },
    }));
  },

  /**
   * 獲取指定貨架的當前狀態
   * @param {string} id - 貨架的 ID
   * @returns {object} 包含感應器狀態的物件
   */
  getCraneState: (id) => get().craneStates[id],
}));