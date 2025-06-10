// src/stores/conveyorStore.js
import { create } from 'zustand';

export const useConveyorStore = create((set) => ({
  rotate: false,
  rollerSpeed: -20, // Default speed for the roller
  setRotate: (value) => set({ rotate: value }),
  setRollerSpeed: (value) => set({ rollerSpeed: value }),
}));