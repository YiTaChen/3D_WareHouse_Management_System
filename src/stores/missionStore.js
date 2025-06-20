import { create } from 'zustand';
import { stepFunctions } from '../missions/craneMissionData';

export const useMissionStore = create((set, get) => ({
  mission: null,

  setMission: (mission) => set({ mission }),

  runMission: async () => {
    const mission = get().mission;
    if (!mission) return;

    mission.status = 'running';
    mission.currentTaskIndex = 0;
    set({ mission });
    await get().runCurrentTask();
  },

  runCurrentTask: async () => {
    const mission = get().mission;
    if (!mission) return;
    const task = mission.tasks[mission.currentTaskIndex];
    if (!task) return;

    task.status = 'running';
    task.currentStepIndex = 0;
    set({ mission });
    await get().runCurrentStep();
  },

  runCurrentStep: async () => {
    const mission = get().mission;
    if (!mission) return;
    const task = mission.tasks[mission.currentTaskIndex];
    const step = task.steps[task.currentStepIndex];
    if (!step) return;

    step.status = 'running';
    set({ mission });

    const fn = stepFunctions[step.functionKey];
    if (!fn) {
      console.error(`找不到函式: ${step.functionKey}`);
      step.status = 'error';
      set({ mission });
      return;
    }

    try {
      const result = await fn(step.params);
      if (result) {
        step.status = 'done';
        task.currentStepIndex++;
        set({ mission });

        if (task.currentStepIndex < task.steps.length) {
          await get().runCurrentStep();
        } else {
          task.status = 'done';
          mission.currentTaskIndex++;
          set({ mission });

          if (mission.currentTaskIndex < mission.tasks.length) {
            await get().runCurrentTask();
          } else {
            mission.status = 'done';
            set({ mission });
          }
        }
      } else {
        step.status = 'error';
        set({ mission });
      }
    } catch (e) {
      console.error('step 執行錯誤', e);
      step.status = 'error';
      set({ mission });
    }
  },
}));
