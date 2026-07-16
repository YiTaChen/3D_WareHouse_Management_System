import { create } from 'zustand';
import { stepFunctions } from '../missions/adapters/stepFunctions';
import { runMission as runRuntimeMission } from '../missions/runtime/missionRunner';

export const useMissionStore = create((set, get) => ({
  mission: null,

  setMission: (mission) => set({ mission }),

  runMission: async () => {
    const mission = get().mission;
    if (!mission) return;

    return runRuntimeMission(mission, stepFunctions, {
      onMissionChange: (updatedMission) => set({ mission: updatedMission }),
    });
  },
}));
