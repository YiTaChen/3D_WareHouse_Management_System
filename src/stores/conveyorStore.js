// src/stores/conveyorStore.js
import { create } from 'zustand';
import layoutData from '../data/layoutData'; // 引入 layoutData



const initializeConveyorStates = () => {
  const conveyorStates = {};
  layoutData.conveyors.forEach(conv => {
    conveyorStates[conv.id] = {
      rotate: false, // 預設不轉動
      speed: -20,    // 預設速度

      sensor1Detected: false, // 新增：感應器1是否檢測到物體
      sensor2Detected: false, // 新增：感應器2是否檢測到物體
      lightColor: '#808080', // 新增：燈的顏色，預設灰色 (關閉狀態)

      


    };
  });
  return conveyorStates;
  // console.log('Conveyor states initialized:', conveyorStates);
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

          lightColor: isRotate ? '#00FF00' : '#808080', // 綠燈 (啟動), 灰燈 (停止)
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
   * 設定指定輸送帶的感應器狀態
   * @param {string} id - 輸送帶的 ID
   * @param {string} sensorKey - 'sensor1Detected' 或 'sensor2Detected'
   * @param {boolean} detected - 是否檢測到物體
   */
  setSensorDetected: (id, sensorKey, detected) => {
    set((state) => {
      const newConveyorStates = {
        ...state.conveyorStates,
        [id]: {
          ...state.conveyorStates[id],
          [sensorKey]: detected,
        },
      };

      // 根據感應器狀態更新燈的顏色
      // 如果任何一個感應器檢測到物體，且輸送帶在轉動，則燈為紅燈
      const currentConvState = newConveyorStates[id];
      if (currentConvState.rotate) {
        if (currentConvState.sensor1Detected || currentConvState.sensor2Detected) {
          newConveyorStates[id].lightColor = '#FF0000'; // 紅燈 (有物體且轉動)
        } else {
          newConveyorStates[id].lightColor = '#00FF00'; // 綠燈 (無物體且轉動)
        }
      } else {
        newConveyorStates[id].lightColor = '#808080'; // 灰燈 (停止)
      }

      return { conveyorStates: newConveyorStates };
    });
  },




    /**
   * 獲取指定輸送帶的當前狀態
   * @param {string} id - 輸送帶的 ID
   * @returns {object} 包含 rotate, speed, sensor1Detected, sensor2Detected, lightColor 的物件
   */
  getConveyorState: (id) => get().conveyorStates[id],

  // rotate: false,
  // rollerSpeed: -20, // Default speed for the roller
  // setRotate: (value) => set({ rotate: value }),
  // setRollerSpeed: (value) => set({ rollerSpeed: value }),
}));