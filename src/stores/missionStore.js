import { create } from 'zustand';
import { stepFunctions } from '../missions/adapters/stepFunctions';
import { runMission as runRuntimeMission } from '../missions/runtime/missionRunner';
import { useShelfStore } from './shelfStore.js';

export const useMissionStore = create((set, get) => ({
  mission: null,

  setMission: (mission) => set({ mission }),

  runMission: async () => {
    const mission = get().mission;
    if (!mission || mission.status === 'running') return;

    return runRuntimeMission(mission, stepFunctions, {
      beforeStart: () => {
        if (mission.inboundShelfPosition) {
          useShelfStore.getState().assertShelfAvailable(mission.inboundShelfPosition);
        }
      },
      onMissionChange: (updatedMission) => set({ mission: { ...updatedMission } }),
    });
  },
}));
