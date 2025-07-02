
import { create } from 'zustand';
import * as THREE from 'three';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// const initialBoxesData = {
//   // 'box-001': { id: 'box-001', name: 'Generic Box', content: 'Fragile Item', position: [0, 5, 0] },
//   // 'box-002': { id: 'box-002', name: 'Generic Box', content: 'Heavy Machinery', position: [-8, 5, 0] },
  
//   'box-001': { id: 'box-001', position: [0, 5, 0] },
//   'box-002': { id: 'box-002', position: [-8, 5, 0] },


// };


export const useBoxStore = create((set, get) => ({
  boxesData: {}, // 使用物件來存儲 Box 資料，key 為 boxId
  boxRefs: {}, // 儲存每個 Box 物理體的 React Ref

  // boxesData: initialBoxesData, // 初始化 Box 資料


  // 新增一個非同步函式來從 API 取得 Box 資料
  fetchBoxesData: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/boxPositions/mapFullData`); // api
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // console.log("Fetched box data:", data);
      set({ boxesData: data }); // 更新 store 中的 boxesData
    } catch (error) {
      console.error("Failed to fetch box data:", error);
      // 可以考慮在這裡設定一個錯誤狀態
    }
  },



  // only remove all the box, mark at db  (soft delete)
  softDeleteAllBoxesData: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/boxes/all/remove`); // api
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
    } catch (error) {
      console.error("Failed to fetch box data:", error);
  
    }
  },



  // only remove 1 box, mark at db  (soft delete)
  softDeleteOneBoxData: async (boxId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/boxes/${boxId}/remove`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            box_id: boxId,
          }),
        });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
    } catch (error) {
      console.error("Failed to fetch box data:", error);
  
    }
  },


  updateBoxContentToServer: async (boxId, contentObj) => {
    try {
      const entries = Object.values(contentObj);
      for (const item of entries) {
        await fetch(`${API_BASE_URL}/boxContents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            box_id: boxId,
            item_id: item.id,
            quantity: item.quantity,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to update box content:', error);
    }
  },




  isBoxBound: (boxId) => {
    const boundMoveTable = get().boxBoundToMoveplate[boxId];
    return !!boundMoveTable;
  },
  // 初始化或設定多個 Box 資料
  setBoxesData: (id, data) => {
    set((state) => ({
      boxesData: {
        ...state.boxesData,
        [id]: data, // 使用 id 作為 key
      },
    }));
  },

  setAllBoxesData: (boxesObj) => {
    set({ boxesData: boxesObj });
  },

  // 設置 Box 的物理體 Ref（移除重複定義）
  setBoxRef: (id, ref) => {
    // console.log(`Setting box ref for ${id}:`, ref);
    set((state) => ({
      boxRefs: {
        ...state.boxRefs,
        [id]: ref
      }
    }));
  },

  getBoxData: (boxId) => get().boxesData[boxId],
  getBoxRef: (id) => get().boxRefs[id],

  handleAddSingleBox: (boxId, boxContenetData) => {
    const addBox = get().addBox;
    const newBoxId = boxId ? boxId : `box-${Date.now()}`;
    const randomName = Math.random() > 0.5 ? 'Special Box' : 'Generic Box';
    const randomContent = Math.random() > 0.5 ? 'Fragile' : 'Durable';
    const newBoxData = boxContenetData ? {
      ...boxContenetData,
      position: boxContenetData.position || [0, 3, 0],
    } : {
      id: newBoxId,
      name: randomName,
      content: randomContent,
      position: [0, 3, 0],
    };

    

    addBox(newBoxId, newBoxData);
  },


  

  addBox: async (id = Date.now(), data) => {
    // console.log(`Adding box with id: ${id}`, data.position, ", x: ",data.position[0], ", y: ", data.position[1], ", z: ", data.position[2]);
    // console.log("Box data to be added:", data);
    // console.log("Box data content to be added:", data.content);
    try{

       await get().addBoxInitDataToServer(id); // 新增 Box 初始資料到伺服器
       await get().updateBoxInitPositionServer(id, data.position);

        if (data.content) {
          await get().updateBoxContentToServer(id, data.content);
        }

       set((state) => ({
          boxesData: {
            ...state.boxesData,
            [id]: data,
          },
        }));

    } catch (err) {
      console.error("在 addBox 過程中發生錯誤:", err.message);
      
    }
    
    
  },

  removeBox: (boxId) => set((state) => {
    const newBoxesData = { ...state.boxesData };
    delete newBoxesData[boxId];

    const newBoxRefs = { ...state.boxRefs };
    delete newBoxRefs[boxId];

    return {
      boxesData: newBoxesData,
      boxRefs: newBoxRefs,
    };
  }),

  updateBoxData: (boxId, newData) => set((state) => ({
    boxesData: {
      ...state.boxesData,
      [boxId]: {
        ...state.boxesData[boxId],
        ...newData,
      },
    },
  })),




 getBoxWorldPosition: (boxId) => {
  const ref = get().boxRefs[boxId]?.ref?.current;
  if (ref) {
    const pos = new THREE.Vector3();
    ref.getWorldPosition(pos);
    return pos.toArray(); // ⚠️ 這會是 array，例如 [1.234, 0.0, -5.6]
  }
  return null;
},




  // create box position data when box is added
  updateBoxInitPositionServer: async (boxId, pos) => {
   
    try {
      const response = await fetch(`${API_BASE_URL}/boxPositions/box/${boxId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_x: pos[0],
          position_y: pos[1],
          position_z: pos[2],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '更新失敗');
      }

      const updated = await response.json();
      // console.log(` Box ${boxId} 位置已更新:`, updated);
    } catch (err) {
      console.error(` 更新 box ${boxId} 位置失敗:`, err.message);
    }
  },

  // update box position data when box moving is finished 
  updateBoxCurrentPositionServer: async (boxId) => {
    const pos = get().getBoxWorldPosition(boxId); // [x, y, z]
    if (!pos) {
      console.warn(`無法取得 ${boxId} 的位置`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/boxPositions/box/${boxId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_x: pos[0],
          position_y: pos[1]+0.5, // 調整 y 軸位置，避免 Box 進入地板
          position_z: pos[2],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '更新失敗');
      }

      const updated = await response.json();
      console.log(` Box ${boxId} 位置已更新:`, updated);
    } catch (err) {
      console.error(` 更新 box ${boxId} 位置失敗:`, err.message);
    }
  },



  addBoxInitDataToServer: async (boxId) => {
    
    try {
      const response = await fetch(`${API_BASE_URL}/boxes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          box_id: boxId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '更新失敗');
      }

      const updated = await response.json();
      // console.log(` Box ${boxId} 已新增:`, updated);
    } catch (err) {
      console.error(` 新增 box ${boxId} 失敗:`, err.message);
    }
  },



  // 檢查 Box 是否處於睡眠狀態
  // 使用物理引擎的 velocity 屬性來判斷
  // 如果速度接近零，則認為 Box 處於睡眠狀態

getBoxSleepStatus: (boxId) => {
  const velocity = get().boxRefs[boxId]?.api?.velocity;
  let lastVelocity = [0, 0, 0];
  if (!velocity) return null;

  velocity.subscribe(v => {
    lastVelocity = v;
  })();

  return lastVelocity.every(val => Math.abs(val) < 0.001);
},





wakeUpBox: (boxId) => {
    const ref = get().boxRefs[boxId];
    if (ref?.api?.wakeUp) {
      ref.api.wakeUp();
      // console.log(`Box ${boxId} woke up`);
    }
  },

  moveBoxUp: (boxId, amount = 1) => {
    const ref = get().boxRefs[boxId];
    if (ref?.ref?.current) {
      const obj = ref.ref.current;
      obj.position.y += amount;
      if (ref.api?.position) ref.api.position.set(obj.position.x, obj.position.y, obj.position.z);
      // console.log(`Box ${boxId} moved up by ${amount}`);
    }
  },

  // setStaticBox: (boxId) => {
  //   const ref = get().boxRefs[boxId];
  //   if (ref?.api?.mass) {
  //     ref.api.mass.set(0);   // 讓物理質量變成 0，等於靜態
  //     ref.api.wakeUp && ref.api.wakeUp();
  //     console.log(`Box ${boxId} set to static`);
  //   }
  // },

  // setPassiveBox: (boxId) => {
  //   const ref = get().boxRefs[boxId];
  //   if (ref?.api?.mass) {
  //     ref.api.mass.set(1);   // 恢復動態質量
  //     ref.api.wakeUp && ref.api.wakeUp();
  //     console.log(`Box ${boxId} set to passive (dynamic)`);
  //   }
  // },



  // 新增：存放 Box 綁定到哪個 MoveTable
  boxBoundToMoveplate: {},

  // 設定 Box 綁定 MoveTable (或 Crane) 的關係
  setBoxBoundToMoveplate: (boxId, moveTableId) => {
    set((state) => ({
      boxBoundToMoveplate: {
        ...state.boxBoundToMoveplate,
        [boxId]: moveTableId,
      },
    }));
    // console.log(`Box ${boxId} bound to MoveTable ${moveTableId}`);
  },

  // 清除 Box 綁定
  clearBoxBoundToMoveplate: (boxId) => {
    set((state) => {
      const newBindings = { ...state.boxBoundToMoveplate };
      delete newBindings[boxId];
      return { boxBoundToMoveplate: newBindings };
    });
    // console.log(`Box ${boxId} unbound from MoveTable`);
  },

  // 查詢 Box 綁定到哪個 MoveTable
  getBoxBoundMoveplate: (boxId) => {
    return get().boxBoundToMoveplate[boxId] || null;
  },


  setStaticBox: (boxId) => {
    const ref = get().boxRefs[boxId];
    if (ref?.api?.mass) {
      get().setBoxVelocity(boxId, [0, 0, 0]); // 確保靜態時速度為零
      get().setBoxAngularVelocity(boxId, [0, 0, 0]); // 確保靜態時角速度為零
      ref.api.mass.set(0);
      ref.api.wakeUp && ref.api.wakeUp();
      set((state) => ({
        boxesData: {
          ...state.boxesData,
          [boxId]: {
            ...state.boxesData[boxId],
            boxType: 'static',
          },
        },
      }));
      // console.log(`Box ${boxId} set to static`);
    }
  },

  setPassiveBox: (boxId) => {
    const ref = get().boxRefs[boxId];
    if (ref?.api?.mass) {
      ref.api.mass.set(1);
      ref.api.wakeUp && ref.api.wakeUp();
      set((state) => ({
        boxesData: {
          ...state.boxesData,
          [boxId]: {
            ...state.boxesData[boxId],
            boxType: 'dynamic',
          },
        },
      }));
      // console.log(`Box ${boxId} set to passive (dynamic)`);
    }
  },

  getBoxType: (boxId) => {
    return get().boxesData[boxId]?.boxType || 'dynamic';
  },


  getBoxVelocity: (boxId) => {

    const ref = get().boxRefs[boxId];
    
    // const api = get().boxRefs[boxId]?.api;
    const api = ref?.api;

    if (api?.velocity) {
      let currentVelocity = [0, 0, 0];
      api.velocity.subscribe(v => {
        currentVelocity = v;
      })();
      return currentVelocity;
    }
    return null;
  },

  setBoxVelocity: (boxId, velocity) => {
    const api = get().boxRefs[boxId]?.api;
    if (api?.velocity?.set && Array.isArray(velocity) && velocity.length === 3) {
      api.velocity.set(...velocity);
      // console.log(`Velocity of Box ${boxId} set to`, velocity);
    }
  },

  setBoxAngularVelocity: (boxId, angularVelocity) => {
    const api = get().boxRefs[boxId]?.api;
    if (api?.angularVelocity?.set && Array.isArray(angularVelocity) && angularVelocity.length === 3) {
      api.angularVelocity.set(...angularVelocity);
      // console.log(`Angular velocity of Box ${boxId} set to`, angularVelocity);
    }
  },

  stopBoxMotion: (boxId) => {
    const ref = get().boxRefs[boxId];
    if (ref?.api?.velocity?.set) {
      ref.api.velocity.set(0, 0, 0);
      ref.api.angularVelocity.set(0, 0, 0);
      ref.api.wakeUp?.();  // 先喚醒再讓它睡
      ref.api.sleep?.();
      // console.log(`Box ${boxId} velocity cleared and put to sleep`);
    }
  },


}));