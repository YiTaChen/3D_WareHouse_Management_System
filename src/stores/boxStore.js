
import { create } from 'zustand';
import * as THREE from 'three';


// const initialBoxesData = {
//   'box-001': { id: 'box-001', name: 'Red Box', content: 'Fragile Item' },
//   'box-002': { id: 'box-002', name: 'Blue Box', content: 'Heavy Machinery' },
  
// };


export const useBoxStore = create((set, get) => ({
  boxesData: {}, // 使用物件來存儲 Box 資料，key 為 boxId
  boxRefs: {}, // 儲存每個 Box 物理體的 React Ref

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


  


  addBox: (id = Date.now(), data) => {
    set((state) => ({
      boxesData: {
        ...state.boxesData,
        [id]: data,
      },
    }));
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