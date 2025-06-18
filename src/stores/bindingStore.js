import { create } from 'zustand';


export const useBindingStore = create((set, get) => ({
  craneBindings: {},


  // 新增：存储从 CraneBindingLogic 传递过来的绑定函数和状态
  // 结构: { craneId: { bindObject: func, unbindObject: func, isCraneBound: boolean_value } }
  craneBindingActions: {},

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

  // 新增 Action: 设置特定 craneId 的绑定函数和状态
  setCraneBindingActions: (craneId, actions) => {
    set((state) => ({
      craneBindingActions: {
        ...state.craneBindingActions,
        [craneId]: actions,
      },
    }));
  },

  // 新增 Selector: 获取特定 craneId 的绑定函数和状态
  getCraneBindingActions: (craneId) => get().craneBindingActions[craneId],





}));