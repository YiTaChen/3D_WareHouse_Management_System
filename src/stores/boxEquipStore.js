import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// 定義 Store 的型態 (可選)
// type BoxCollisionStatusState = {
//   boxCollisionStatus: {
//     [boxId: string]: string | null; // key: boxId, value: equipmentId 或 null
//   };
//   setBoxCollidingWithEquipment: (boxId: string, equipmentId: string) => void;
//   clearBoxCollision: (boxId: string) => void;
//   getEquipmentForBox: (boxId: string) => string | null;
// };

export const useBoxEquipStore = create(
  immer((set, get) => ({
    boxCollisionStatus: {}, // 初始化碰撞狀態為空物件

    /**
     * 設定或更新一個 Box 正在與哪個 Equipment 碰撞。
     * 如果 Box 已經與其他 Equipment 碰撞，會被新的取代。
     * @param {string} boxId - 發生碰撞的 Box ID
     * @param {string} equipmentId - 與 Box 碰撞的 Equipment ID
     */
    setBoxCollidingWithEquipment: (boxId, equipmentId) => {
      set((state) => {
        state.boxCollisionStatus[boxId] = equipmentId;
      });
    //   console.log(`[BoxCollisionStatusStore] Box ${boxId} now colliding with Equipment ${equipmentId}. Current state:`, get().boxCollisionStatus);
    },

    /**
     * 清除一個 Box 的碰撞狀態 (表示它不再與任何 Equipment 碰撞)。
     * @param {string} boxId - 要清除狀態的 Box ID
     */
    clearBoxCollision: (boxId) => {
      set((state) => {
        if (state.boxCollisionStatus[boxId]) {
          delete state.boxCollisionStatus[boxId];
        }
        else {
        //   console.warn(`[BoxCollisionStatusStore] Attempted to clear collision for Box ${boxId}, but it was not colliding with any Equipment.`);
        }
      });
    //   console.log(`[BoxCollisionStatusStore] Box ${boxId} no longer colliding. Current state:`, get().boxCollisionStatus);
    },

    /**
     * 獲取一個 Box 當前正在與哪個 Equipment 碰撞。
     * @param {string} boxId - 要查詢的 Box ID
     * @returns {string | null} 碰撞的 Equipment ID，如果沒有則返回 null
     */
    getEquipmentForBox: (boxId) => {
      return get().boxCollisionStatus[boxId] || null;
    },
  }))
);