// src/stores/conveyorStore.js
import { create } from 'zustand';
import layoutData from '../data/layoutData'; // 引入 layoutData



const initializeConveyorStates = () => {
  const conveyorStates = {};
  layoutData.conveyors.forEach(conv => {
    conveyorStates[conv.id] = {
      rotate: false, // 預設不轉動
      speed: -20,    // 預設速度


      BulkSensorDetected: false, // 新增：感應器是否檢測到物體

      sensor1Detected: false, // 新增：感應器1是否檢測到物體
      sensor2Detected: false, // 新增：感應器2是否檢測到物體
      lightColor: '#808080', // 新增：燈的顏色，預設灰色 (關閉狀態)

      


    };
  });
  return conveyorStates;
  // console.log('Conveyor states initialized:', conveyorStates);
};


// get light color
const calculateLightColor = (conveyorState) => {
  if (conveyorState.rotate) {
    // 如果輸送帶在轉動
    // if (conveyorState.sensor1Detected || conveyorState.sensor2Detected)
    if (conveyorState.BulkSensorDetected) 
    {
      return '#FF0000'; // 紅燈 (有物體且轉動)
    } else {
      return '#00FF00'; // 綠燈 (無物體且轉動)
    }
  } else {
    // 如果輸送帶停止

    if (conveyorState.BulkSensorDetected) 
    {
      return '#FFD580'; // 橘燈 (有物體 且 無轉動)
    } else {
      return '#808080'; // 灰色 (無物體 且 無轉動)
    }


    
    // return '#808080'; // 灰燈 (停止)
  }
};


export const useConveyorStore = create((set, get) => ({


  conveyorStates: initializeConveyorStates(),

  setConveyorRotate: (id, isRotate) =>
    set((state) => 
    {
    const currentConvState = state.conveyorStates[id];
    const updatedConvState = {
      ...currentConvState,
      rotate: isRotate,
    };
    // console.log('Conveyor rotate state:', isRotate, 'for id:', id);
    // console.log('Current conveyor state:', currentConvState);
    // console.log('Updated conveyor state:', updatedConvState);


    updatedConvState.lightColor = calculateLightColor(updatedConvState);

    return {
        conveyorStates: {
          ...state.conveyorStates,
          [id]: updatedConvState,
        },
      };

    //   ({
    //   conveyorStates: {
    //     ...state.conveyorStates,
    //     [id]: {
    //       ...state.conveyorStates[id],
    //       rotate: isRotate,

    //       lightColor: isRotate ? '#00FF00' : '#808080', // 綠燈 (啟動), 灰燈 (停止)
    //     },
    //   },
    // })
  
    }
    ),

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
      // const newConveyorStates = {
      //   ...state.conveyorStates,
      //   [id]: {
      //     ...state.conveyorStates[id],
      //     [sensorKey]: detected,
      //   },
      // };

      // 根據感應器狀態更新燈的顏色
      // 如果任何一個感應器檢測到物體，且輸送帶在轉動，則燈為紅燈
      // const currentConvState = newConveyorStates[id];


       const currentConvState = state.conveyorStates[id];
      const updatedConvState = {
        ...currentConvState,
        [sensorKey]: detected,
      };
      updatedConvState.lightColor = calculateLightColor(updatedConvState);

      // 整合
      // if (currentConvState.rotate) {
      //   if (currentConvState.sensor1Detected || currentConvState.sensor2Detected) {
      //     newConveyorStates[id].lightColor = '#FF0000'; // 紅燈 (有物體且轉動)
      //   } else {
      //     newConveyorStates[id].lightColor = '#00FF00'; // 綠燈 (無物體且轉動)
      //   }
      // } else {
      //   newConveyorStates[id].lightColor = '#808080'; // 灰燈 (停止)
      // }

      // return { conveyorStates: newConveyorStates };

      return { conveyorStates: { ...state.conveyorStates, [id]: updatedConvState }};

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


  // // Corrected setConveyorRotateSpeedNagetive function
  // setConveyorRotateSpeedPasitive: async ({ conveyorId }) => {
  //     console.log(`aaa [setConveyorRotateSpeedPasitive] Attempting to stop conveyor ${conveyorId} rotation`);
      
  //     // If conveyorId is 'pass', do not execute stop logic
  //     if (conveyorId !== 'pass') { // Using strict inequality for robustness
  //         // Get setConveyorSpeed directly from 'get()'
  //         const setSpeedFn = get().setConveyorSpeed; // <--- This is the correct way

  //         console.log(`bbbb [setConveyorRotateSpeedPasitive] Preparing to stop conveyor ${conveyorId} rotation`);

  //         if (!setSpeedFn) {
  //             console.warn('[setSpeedFn] Could not get setConveyorSpeed function.');
  //             return false;
  //         }

  //         const currentConveyorState = get().conveyorStates[conveyorId];
  //         if (!currentConveyorState) {
  //             console.warn(`[setConveyorRotateSpeedPasitive] No state found for conveyor ${conveyorId}.`);
  //             return false;
  //         }

  //         // Calculate negative speed
  //         const positiveSpeed =  0- Math.abs(currentConveyorState.speed);

  //         console.log(` setConveyorRotateSpeedPasitive: new speed for ${conveyorId} is ${positiveSpeed} `);

  //         // Execute speed setting
  //         setSpeedFn(conveyorId, positiveSpeed);
  //     }
      
  //     // Simulate waiting: wait for 1 second
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     return true;
  // },

  // // Corrected setConveyorRotateSpeedNagetive function
  // setConveyorRotateSpeedNagetive: async ({ conveyorId }) => {
  //     console.log(`aaa [setConveyorRotateSpeedNagetive] Attempting to stop conveyor ${conveyorId} rotation`);
      
  //     // If conveyorId is 'pass', do not execute stop logic
  //     if (conveyorId !== 'pass') { // Using strict inequality for robustness
  //         // Get setConveyorSpeed directly from 'get()'
  //         const setSpeedFn = get().setConveyorSpeed; // <--- This is the correct way

  //         console.log(`bbbb [setConveyorRotateSpeedNagetive] Preparing to stop conveyor ${conveyorId} rotation`);

  //         if (!setSpeedFn) {
  //             console.warn('[setSpeedFn] Could not get setConveyorSpeed function.');
  //             return false;
  //         }

  //         const currentConveyorState = get().conveyorStates[conveyorId];
  //         if (!currentConveyorState) {
  //             console.warn(`[setConveyorRotateSpeedNagetive] No state found for conveyor ${conveyorId}.`);
  //             return false;
  //         }

  //         // Calculate negative speed
  //         const nagetiveSpeed =  Math.abs(currentConveyorState.speed);

  //         console.log(` setConveyorRotateSpeedNagetive: new speed for ${conveyorId} is ${nagetiveSpeed} `);

  //         // Execute speed setting
  //         setSpeedFn(conveyorId, nagetiveSpeed);
  //     }
      
  //     // Simulate waiting: wait for 1 second
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     return true;
  // },


}));