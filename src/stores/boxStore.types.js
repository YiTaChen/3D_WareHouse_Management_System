export const createBoxStoreSlice = (set, get) => ({
  boxes: [],
  addBox: (pos = [0, 3, 0]) => {},
  clearBoxes: () => {},
  getBoxById: (id) => {},  // 可擴充功能
})