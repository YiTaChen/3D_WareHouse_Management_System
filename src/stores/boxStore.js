// src/stores/boxStore.js
import { create } from 'zustand';

export const useBoxStore = create((set, get) => ({
  boxes: [],
  addBox: (pos = [0, 3, 0]) => set((state) => ({ boxes: [...state.boxes, { id: Date.now(), position: pos }] })),
  clearBoxes: () => set({ boxes: [] }),
  getBoxById: (id) => get().boxes.find((b) => b.id === id),
}));