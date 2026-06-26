import { create } from 'zustand';

import layoutData from '../data/layoutData.js';
import {
  addConveyor as addConveyorToLayout,
  createConveyorLayout,
  getConveyorById as findConveyorById,
  getVisibleConveyors as filterVisibleConveyors,
  removeConveyor as removeConveyorFromLayout,
  restoreConveyor as restoreConveyorInLayout,
  updateConveyor as updateConveyorInLayout,
} from '../conveyors/conveyorLayout.js';

const getFirstVisibleConveyorId = (conveyors) => (
  filterVisibleConveyors(conveyors)[0]?.id || ''
);

const getSafeSelectedConveyorId = (conveyors, selectedConveyorId) => (
  findConveyorById(conveyors, selectedConveyorId)
    ? selectedConveyorId
    : getFirstVisibleConveyorId(conveyors)
);

export const createConveyorLayoutStore = (initialConveyors = layoutData.conveyors) => (
  create((set, get) => {
    const initialLayout = createConveyorLayout(initialConveyors);

    return {
      conveyors: initialLayout,
      selectedConveyorId: getFirstVisibleConveyorId(initialLayout),

      getVisibleConveyors: () => filterVisibleConveyors(get().conveyors),
      getConveyorById: (id, options) => findConveyorById(get().conveyors, id, options),
      getSelectedConveyor: () => findConveyorById(get().conveyors, get().selectedConveyorId),

      selectConveyor: (id) => set((state) => ({
        selectedConveyorId: findConveyorById(state.conveyors, id) ? id : '',
      })),

      addConveyor: (input) => set((state) => {
        const conveyors = addConveyorToLayout(state.conveyors, input);
        const selectedConveyorId = conveyors.at(-1)?.id || state.selectedConveyorId;

        return {
          conveyors,
          selectedConveyorId,
        };
      }),

      updateConveyor: (id, updates) => set((state) => {
        const conveyors = updateConveyorInLayout(state.conveyors, id, updates);

        return {
          conveyors,
          selectedConveyorId: getSafeSelectedConveyorId(conveyors, state.selectedConveyorId),
        };
      }),

      removeConveyor: (id) => set((state) => {
        const conveyors = removeConveyorFromLayout(state.conveyors, id);

        return {
          conveyors,
          selectedConveyorId: getSafeSelectedConveyorId(conveyors, state.selectedConveyorId),
        };
      }),

      restoreConveyor: (id) => set((state) => {
        const conveyors = restoreConveyorInLayout(state.conveyors, id);

        return {
          conveyors,
          selectedConveyorId: findConveyorById(conveyors, id) ? id : state.selectedConveyorId,
        };
      }),

      resetConveyorLayout: (nextConveyors = layoutData.conveyors) => {
        const conveyors = createConveyorLayout(nextConveyors);

        set({
          conveyors,
          selectedConveyorId: getFirstVisibleConveyorId(conveyors),
        });
      },
    };
  })
);

export const useConveyorLayoutStore = createConveyorLayoutStore();
