import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// 定義 Store 的型態 (可選，但推薦用於型別安全)
// type CollisionState = {
//   collisions: {
//     [equipmentId: string]: string[]; // key: equipmentId, value: boxId[]
//   };
//   addCollision: (equipmentId: string, boxId: string) => void;
//   removeCollision: (equipmentId: string, boxId: string) => void;
//   clearCollisionsForEquipment: (equipmentId: string) => void;
//   getBoxesForEquipment: (equipmentId: string) => string[];
//   isBoxCollidingWithEquipment: (equipmentId: string, boxId: string) => boolean;
// };

export const useEquipBoxStore = create(
  immer((set, get) => ({
    collisions: {}, // 初始化碰撞資料為空物件

    /**
     * 新增一個碰撞關係。
     * 如果 equipmentId 不存在，會建立一個新的陣列。
     * 如果 boxId 已經存在於該 equipment 的列表中，則不會重複新增。
     * @param {string} equipmentId - 發生碰撞的設備 ID (e.g., crane ID)
     * @param {string} boxId - 發生碰撞的 Box ID
     */
    addCollision: (equipmentId, boxId) => {
      set((state) => {
        if (!state.collisions[equipmentId]) {
          state.collisions[equipmentId] = [];
        }
        if (!state.collisions[equipmentId].includes(boxId)) {
          state.collisions[equipmentId].push(boxId);
        }
      });
      console.log(`[CollisionStore] Added: Equipment ${equipmentId} now includes Box ${boxId}. Current state:`, get().collisions);
    },

    /**
     * 移除一個碰撞關係。
     * @param {string} equipmentId - 設備 ID
     * @param {string} boxId - 要移除的 Box ID
     */
    removeCollision: (equipmentId, boxId) => {
      set((state) => {
        if (state.collisions[equipmentId]) {
          state.collisions[equipmentId] = state.collisions[equipmentId].filter(
            (id) => id !== boxId
          );
          // 如果該 equipment 沒有任何碰撞了，可以選擇刪除該 entry
          if (state.collisions[equipmentId].length === 0) {
            delete state.collisions[equipmentId];
          }
        }
      });
      console.log(`[CollisionStore] Removed: Equipment ${equipmentId} no longer includes Box ${boxId}. Current state:`, get().collisions);
    },

    /**
     * 清空某個 equipment 的所有碰撞記錄。
     * @param {string} equipmentId - 要清空的設備 ID
     */
    clearCollisionsForEquipment: (equipmentId) => {
      set((state) => {
        if (state.collisions[equipmentId]) {
          delete state.collisions[equipmentId];
        }
      });
      console.log(`[CollisionStore] Cleared all collisions for Equipment ${equipmentId}. Current state:`, get().collisions);
    },

    /**
     * 獲取與某個 equipment 碰撞的所有 Box ID。
     * @param {string} equipmentId - 設備 ID
     * @returns {string[]} 碰撞的 Box ID 列表，如果沒有則返回空陣列
     */
    getBoxesForEquipment: (equipmentId) => {
      return get().collisions[equipmentId] || [];
    },

    /**
     * 檢查某個 Box 是否正在與特定 equipment 碰撞。
     * @param {string} equipmentId - 設備 ID
     * @param {string} boxId - 要檢查的 Box ID
     * @returns {boolean} - 如果正在碰撞則為 true，否則為 false
     */
    isBoxCollidingWithEquipment: (equipmentId, boxId) => {
      const boxes = get().collisions[equipmentId];
      return boxes ? boxes.includes(boxId) : false;
    },

    // 可以在此處新增其他操作，例如更新整個列表（但不建議直接修改，除非有特殊需求）
    updateCollisionsForEquipment: (equipmentId, newBoxIds) => {
      set((state) => {
        state.collisions[equipmentId] = newBoxIds;
      });
    },
  }))
);