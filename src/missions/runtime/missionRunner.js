const notifyMissionChange = (mission, callbacks = {}) => {
  const onMissionChange = callbacks.onMissionChange || callbacks.onChange;
  if (onMissionChange) onMissionChange(mission);
};

const setMissionStatus = (mission, status, callbacks) => {
  mission.status = status;
  notifyMissionChange(mission, callbacks);
};

const setStepStatus = (mission, step, status, callbacks) => {
  step.status = status;
  notifyMissionChange(mission, callbacks);
};

const setExecutionError = (mission, task, step, callbacks) => {
  step.status = 'error';
  task.status = 'error';
  mission.status = 'error';
  notifyMissionChange(mission, callbacks);
};

export const runMission = async (mission, stepFunctions, callbacks = {}) => {
  if (!mission) return mission;

  mission.status = 'running';
  mission.currentTaskIndex = 0;
  notifyMissionChange(mission, callbacks);

  const tasks = mission.tasks || [];

  for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
    const task = tasks[taskIndex];
    mission.currentTaskIndex = taskIndex;
    task.status = 'running';
    task.currentStepIndex = 0;
    notifyMissionChange(mission, callbacks);

    const steps = task.steps || [];

    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      const step = steps[stepIndex];
      task.currentStepIndex = stepIndex;
      setStepStatus(mission, step, 'running', callbacks);

      const stepFunction = stepFunctions?.[step.functionKey];
      if (!stepFunction) {
        setExecutionError(mission, task, step, callbacks);
        return mission;
      }

      try {
        const result = await stepFunction(step.params);
        if (!result) {
          setExecutionError(mission, task, step, callbacks);
          return mission;
        }
      } catch {
        setExecutionError(mission, task, step, callbacks);
        return mission;
      }

      step.status = 'done';
      task.currentStepIndex++;
      notifyMissionChange(mission, callbacks);
    }

    task.status = 'done';
    mission.currentTaskIndex++;
    notifyMissionChange(mission, callbacks);
  }

  setMissionStatus(mission, 'done', callbacks);
  return mission;
};
