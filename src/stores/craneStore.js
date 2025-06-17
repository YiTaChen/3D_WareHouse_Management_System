import { create } from 'zustand';
// 假設你有一個 CraneData.js 包含貨架的配置
// import CraneData from '../data/CraneData'; // 如果有需要，可以引入貨架數據
import * as THREE from 'three'; // 引入 Three.js 用於向量計算


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
  craneStates['crane001'] = { // 使用你的 GLTF 模型名或一個唯一的 ID
    BulkSensorDetected: false,
    // 這裡可以擴展為每個層板或區域的感測器狀態，例如:
    // craneLayer1Occupied: false,
    // craneLayer2Occupied: false,

    // Crane 整體移動相關狀態
    currentCranePosition: new THREE.Vector3(0, 3, -10), // Crane 初始世界座標
    targetCranePosition: new THREE.Vector3(0, 3, -10),  // Crane 目標世界座標
    craneMoveSpeed: 1, // Crane 整體移動速度 (單位/秒)

    // moveTable 移動相關狀態
    // 注意：moveTable 的位置是相對於 Crane 根部的「偏移量」
    // 因為它的物理體是 Kinematic，我們會直接設定它的世界座標，但邏輯上它是相對於 Crane 移動
    currentMoveTableLocalOffset: new THREE.Vector3(0, 1, 0), // moveTable 相對於 Crane 根部的當前本地偏移 (預設為 0)
    targetMoveTableLocalOffset: new THREE.Vector3(0, 1, 0),  // moveTable 相對於 Crane 根部的目標本地偏移
    moveTableSpeed: 1, // moveTable 移動速度 (單位/秒)

    isCraneMoving: false,
    isMoveTableMoving: false,
    isMoveTableMoving: false, 
    
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

  // --- 新增 Crane 移動 Action ---

  /**
   * 設定 Crane 整體移動的目標位置和速度
   * @param {string} id - Crane 的 ID
   * @param {number[]} targetPosition - 目標世界座標 [x, y, z]
   * @param {number} speed - 移動速度 (單位/秒)
   */
  setCraneTargetPosition: (id, targetPosition, speed) => {
    set((state) => {
      const craneState = state.craneStates[id];
      if (!craneState) return {};

      // 如果 moveTable 正在移動，則不允許 Crane 移動
      if (craneState.isMoveTableMoving) {
        console.warn(`Crane ${id}: Cannot move crane while moveTable is in motion.`);
        return {}; // 不更新狀態
      }

      const newTargetPos = new THREE.Vector3(...targetPosition);
      const newSpeed = speed > 0 ? speed : craneState.craneMoveSpeed; // 使用預設速度如果傳入無效

      return {
        craneStates: {
          ...state.craneStates,
          [id]: {
            ...craneState,
            targetCranePosition: newTargetPos,
            craneMoveSpeed: newSpeed,
            isCraneMoving: !craneState.currentCranePosition.equals(newTargetPos), // 如果目標不同於當前，則認為正在移動
          },
        },
      };
    });
  },

  /**
   * 更新 Crane 的當前實際位置 (由 Crane.jsx 調用)
   * @param {string} id - Crane 的 ID
   * @param {number[]} currentPosition - Crane 的當前世界座標 [x, y, z]
   */
  updateCraneCurrentPosition: (id, currentPosition) => {
    set((state) => {
      const craneState = state.craneStates[id];
      if (!craneState) return {};

      const newCurrentPos = new THREE.Vector3(...currentPosition);
      const isMoving = !newCurrentPos.equals(craneState.targetCranePosition); // 判斷是否已到達目標

      return {
        craneStates: {
          ...state.craneStates,
          [id]: {
            ...craneState,
            currentCranePosition: newCurrentPos,
            isCraneMoving: isMoving,
          },
        },
      };
    });
  },

  // --- 新增 moveTable 移動 Action ---

  /**
   * 設定 moveTable 相對於 Crane 根部的目標本地偏移和速度
   * @param {string} id - Crane 的 ID
   * @param {number[]} targetOffset - 目標本地偏移量 [offsetX, offsetY, offsetZ]
   * @param {number} speed - 移動速度 (單位/秒)
   */
  setMoveTableTargetLocalOffset: (id, targetOffset, speed) => {
    set((state) => {
      const craneState = state.craneStates[id];
      if (!craneState) return {};

      // 如果 Crane 主體正在移動，則不允許 moveTable 移動
      if (craneState.isCraneMoving) {
        console.warn(`Crane ${id}: Cannot move moveTable while crane is in motion.`);
        return {}; // 不更新狀態
      }

      const newTargetOffset = new THREE.Vector3(...targetOffset);
      const newSpeed = speed > 0 ? speed : craneState.moveTableSpeed; // 使用預設速度如果傳入無效

      return {
        craneStates: {
          ...state.craneStates,
          [id]: {
            ...craneState,
            targetMoveTableLocalOffset: newTargetOffset,
            moveTableSpeed: newSpeed,
            isMoveTableMoving: !craneState.currentMoveTableLocalOffset.equals(newTargetOffset), // 如果目標不同於當前，則認為正在移動
          },
        },
      };
    });
  },

  /**
   * 更新 moveTable 的當前實際本地偏移 (由 Crane.jsx 調用)
   * @param {string} id - Crane 的 ID
   * @param {number[]} currentOffset - moveTable 的當前本地偏移 [offsetX, offsetY, offsetZ]
   */
  updateMoveTableCurrentLocalOffset: (id, currentOffset) => {
    set((state) => {
      const craneState = state.craneStates[id];
      if (!craneState) return {};

      const newCurrentOffset = new THREE.Vector3(...currentOffset);
      const isMoving = !newCurrentOffset.equals(craneState.targetMoveTableLocalOffset); // 判斷是否已到達目標

      return {
        craneStates: {
          ...state.craneStates,
          [id]: {
            ...craneState,
            currentMoveTableLocalOffset: newCurrentOffset,
            isMoveTableMoving: isMoving,
          },
        },
      };
    });
  },



}));