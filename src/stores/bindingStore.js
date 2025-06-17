import { create } from 'zustand';


export const useBindingStore = create((set, get) => ({
  craneBindings: {},

  setCraneBinding: (craneId, boundObjectId, constraintApi) => {
    set((state) => ({
      craneBindings: {
        ...state.craneBindings,
        [craneId]: {
          boundObjectId: boundObjectId,
          constraintApi: constraintApi,
        },
      },
    }));
  },

  getCraneBinding: (craneId) => get().craneBindings[craneId],

  isObjectBoundToAnyCrane: (objectId) => {
    const bindings = get().craneBindings;
    for (const craneId in bindings) {
      if (bindings[craneId].boundObjectId === objectId) {
        return craneId;
      }
    }
    return null;
  },

  isCraneBound: (craneId) => {
    const binding = get().craneBindings[craneId];
    return !!(binding && binding.boundObjectId);
  },
}));