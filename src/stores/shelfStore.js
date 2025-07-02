import { create } from 'zustand';
// 假設你有一個 ShelfData.js 包含貨架的配置
// import ShelfData from '../data/ShelfData'; // 如果有需要，可以引入貨架數據

import ShelfData from '../data/ShelfData'; 


const initializeShelfStates = () => {
  const shelfStates = {};
  // 這裡可以根據你的 ShelfData 來初始化多個貨架的狀態
  // 例如，如果每個貨架有唯一的 ID，可以這樣做
  // ShelfData.shelves.forEach(shelf => {
  //   shelfStates[shelf.id] = {
  //     BulkSensorDetected: false,
  //     // 其他可能狀態，例如每個層板的狀態
  //   };
  // });

  // 暫時為單個貨架設置一個預設狀態，你可以根據實際 ShelfData 調整
  shelfStates['shelf_ver1'] = { // 使用你的 GLTF 模型名或一個唯一的 ID
    BulkSensorDetected: false,
    // 這裡可以擴展為每個層板或區域的感測器狀態，例如:
    // shelfLayer1Occupied: false,
    // shelfLayer2Occupied: false,
  };
  return shelfStates;
};

export const useShelfStore = create((set, get) => ({
  shelfStates: initializeShelfStates(),

  /**
   * 設定指定貨架的感應器狀態
   * @param {string} id - 貨架的 ID (例如 'shelf_ver1')
   * @param {string} sensorKey - 感應器的鍵 (例如 'BulkSensorDetected' 或 'shelfLayer1Occupied')
   * @param {boolean} detected - 是否檢測到物體
   */
  setShelfSensorDetected: (id, sensorKey, detected) => {
    set((state) => ({
      shelfStates: {
        ...state.shelfStates,
        [id]: {
          ...state.shelfStates[id],
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
  getShelfState: (id) => get().shelfStates[id],


  getShelfPosition: (shelfID) => {
    // 從 ShelfData.shelves 陣列中尋找匹配的貨架
    const shelf = ShelfData.shelves.find(s => s.id === shelfID);
    let position = [0, 0, 0]; // 預設位置
    if (shelf && shelf.position) {
      position = [shelf.position[0], shelf.position[1]+3, shelf.position[2]];
    }
    // console.log('getShelfPosition', shelfID, shelf.position);

    return shelf ? position : undefined;
  },




  /**
   * 取得所有符合條件的空貨架列表。
   * 條件：
   * 1. 貨架的 z 座標為 -8 或 -6。
   * 2. 貨架的 BulkSensorDetected 狀態為 false (表示是空的)。
   * @returns {Array<object>} 符合條件的貨架物件列表，每個物件包含 id 和 position。
   */
  getEmptyShelfListPort1: () => {
      const allShelves = ShelfData.shelves;
      const currentShelfStates = get().shelfStates; // 取得當前 store 中的貨架狀態

      const emptyShelves = allShelves.filter(shelf => {
        const shelfId = shelf.id;
        const shelfZPosition = shelf.position[2];

        // 條件 1: 檢查 z 座標
        const isCorrectZ = (shelfZPosition === -8 || shelfZPosition === -4);

        // 條件 2: 檢查 shelfStates 中的感測器狀態
        // 如果 shelfId 在 currentShelfStates 中有定義，並且其 BulkSensorDetected 為 false
        // 或者如果 shelfId 尚未在 shelfStates 中被初始化（這表示它預設是空的）
        const shelfState = currentShelfStates[shelfId];
        const isBulkSensorDetectedFalse = shelfState ? !shelfState.BulkSensorDetected : true;

        return isCorrectZ && isBulkSensorDetectedFalse;
      }).map(shelf => ({
        // 返回符合條件貨架的 id 和調整過位置（如果需要的話，這裡保持與 getShelfPosition 一致）
        id: shelf.id,
        position: [shelf.position[0], shelf.position[1] + 3, shelf.position[2]], // 保持與 getShelfPosition 的高度調整一致
      }));

      return emptyShelves;
  },

    /**
     * 取得所有符合條件的空貨架列表。
     * @param {Array<number>} allowedZPositions - 允許的 Z 座標列表 (例如 [-8, -4])
     * @returns {Array<object>} 符合條件的貨架物件列表，每個物件包含 id 和 position。
     */
    getEmptyShelfListByZ: (allowedZPositions) => {
        const allShelves = ShelfData.shelves;
        const currentShelfStates = get().shelfStates;

        const emptyShelves = allShelves.filter(shelf => {
          const shelfId = shelf.id;
          const shelfZPosition = shelf.position[2];

          // 條件 1: 檢查 z 座標是否在允許列表中
          const isCorrectZ = allowedZPositions.includes(shelfZPosition);

          // 條件 2: 檢查 shelfStates 中的感測器狀態
          const shelfState = currentShelfStates[shelfId];
          const isBulkSensorDetectedFalse = shelfState ? !shelfState.BulkSensorDetected : true;

          return isCorrectZ && isBulkSensorDetectedFalse;
        }).map(shelf => ({
          id: shelf.id,
          position: [shelf.position[0], shelf.position[1] + 3, shelf.position[2]],
        }));

        return emptyShelves;
    },
    

}));






