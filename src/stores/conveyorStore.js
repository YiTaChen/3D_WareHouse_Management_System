// src/stores/conveyorStore.js
import { create } from 'zustand';
import layoutData from '../data/layoutData'; // 引入 layoutData



const initializeConveyorStates = () => {
  const conveyorStates = {};
  layoutData.conveyors.forEach(conv => {
    conveyorStates[conv.id] = {
      rotate: false, // 預設不轉動
      speed: -20,    // 預設速度
    };
  });
  return conveyorStates;
  console.log('Conveyor states initialized:', conveyorStates);
};




export const useConveyorStore = create((set, get) => ({


  conveyorStates: initializeConveyorStates(),

  setConveyorRotate: (id, isRotate) =>
    set((state) => ({
      conveyorStates: {
        ...state.conveyorStates,
        [id]: {
          ...state.conveyorStates[id],
          rotate: isRotate,
        },
      },
    })),

  setConveyorSpeed: (id, value) =>
    set((state) => ({
      conveyorStates: {
        ...state.conveyorStates,
        [id]: {
          ...state.conveyorStates[id],
          speed: value,
        },
      },
    })),


    /**
   * 獲取指定輸送帶的當前狀態
   * @param {string} id - 輸送帶的 ID
   * @returns {object} 包含 rotate 和 speed 的物件
   */
  getConveyorState: (id) => get().conveyorStates[id],

  // rotate: false,
  // rollerSpeed: -20, // Default speed for the roller
  // setRotate: (value) => set({ rotate: value }),
  // setRollerSpeed: (value) => set({ rollerSpeed: value }),
}));