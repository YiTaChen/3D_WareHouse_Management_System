import { createBoxStoreSlice } from './boxStore.types'

export const boxStoreImpl = (set, get) => ({
  ...createBoxStoreSlice(
    (update) => set(update),
    () => get()
  ),
  addBox: (pos = [0, 3, 0]) =>
    set((state) => ({
      boxes: [...state.boxes, { id: Date.now(), position: pos }]
    })),
  clearBoxes: () => set({ boxes: [] }),
  getBoxById: (id) => get().boxes.find(b => b.id === id),
})