
import { create } from 'zustand';

// const initialBoxesData = {
//   'box-001': { id: 'box-001', name: 'Red Box', content: 'Fragile Item' },
//   'box-002': { id: 'box-002', name: 'Blue Box', content: 'Heavy Machinery' },
  
// };





export const useBoxStore = create((set, get) => ({
  //  boxes: [],
boxesData: {}, // 使用物件來存儲 Box 資料，key 為 boxId
   // 初始化或設定多個 Box 資料
  setBoxesData: (data) => set({ boxesData: data }),

  
  handleAddSingleBox : (boxId, boxContenetData) => {

    const addBox = get().addBox; // 獲取 addBox action

    const newBoxId = boxId ? boxId: `box-${Date.now()}`; // 確保 ID 唯一 
    const randomName = Math.random() > 0.5 ? 'Special Box' : 'Generic Box';
    const randomContent = Math.random() > 0.5 ? 'Fragile' : 'Durable';
    const newBoxData = boxContenetData ? boxContenetData : {
      id: newBoxId,
      name: randomName,
      content: randomContent,
      AddNewBoxPosition: { x: 3, y: 3, z: 3 }, // 預設位置
    };
    addBox(newBoxId, newBoxData); // 調用 addBox action
  },


  // addBox: (pos = [0, 3, 0]) => set((state) => ({ boxes: [...state.boxes, { id: Date.now(), position: pos }] })),
  addBox: (boxId = Date.now(), data) => set((state) => (
    
    console.log('Adding box with ID:', boxId, 'and data:', data), // Debugging log
    {
    
    boxesData: {
      ...state.boxesData,
      [boxId]: { id: boxId, AddNewBoxPosition: data.AddNewBoxPosition , ...data }, // 確保 id 存在
    },
  })),

  removeBox: (boxId) => set((state) => {
    const newBoxesData = { ...state.boxesData };
    delete newBoxesData[boxId];
    return { boxesData: newBoxesData };
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

  getBoxData: (boxId) => get().boxesData[boxId],


  // clearBoxes: () => set({ boxes: [] }),
  // getBoxById: (id) => get().boxes.find((b) => b.id === id),
}));