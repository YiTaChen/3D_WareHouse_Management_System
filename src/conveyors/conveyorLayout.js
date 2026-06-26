const DEFAULT_POSITION = [0, 0, 0];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_TYPE = 'straight';

const cloneVector = (value, fallback) => (
  Array.isArray(value) ? [...value] : [...fallback]
);

export const normalizeConveyor = (conveyor) => {
  if (!conveyor?.id) {
    throw new Error('Conveyor requires id');
  }

  return {
    ...conveyor,
    position: cloneVector(conveyor.position, DEFAULT_POSITION),
    rotation: cloneVector(conveyor.rotation, DEFAULT_ROTATION),
    type: conveyor.type || DEFAULT_TYPE,
    isRemoved: Boolean(conveyor.isRemoved),
  };
};

export const createConveyorLayout = (conveyors = []) => (
  conveyors.map((conveyor) => normalizeConveyor(conveyor))
);

export const getVisibleConveyors = (conveyors = []) => (
  conveyors.filter((conveyor) => !conveyor.isRemoved)
);

export const getConveyorById = (conveyors = [], id, options = {}) => {
  const conveyor = conveyors.find((item) => item.id === id);

  if (!conveyor) {
    return null;
  }

  if (conveyor.isRemoved && !options.includeRemoved) {
    return null;
  }

  return conveyor;
};

export const createNextConveyorId = (conveyors = []) => {
  const maxIdNumber = conveyors.reduce((maxValue, conveyor) => {
    const match = /^conv(\d+)$/.exec(conveyor.id);

    if (!match) {
      return maxValue;
    }

    return Math.max(maxValue, Number(match[1]));
  }, 0);

  return `conv${maxIdNumber + 1}`;
};

export const addConveyor = (conveyors = [], input = {}) => {
  const id = input.id || createNextConveyorId(conveyors);

  if (conveyors.some((conveyor) => conveyor.id === id)) {
    throw new Error(`Conveyor id already exists: ${id}`);
  }

  return [
    ...conveyors,
    normalizeConveyor({
      id,
      ...input,
    }),
  ];
};

export const updateConveyor = (conveyors = [], id, updates = {}) => (
  conveyors.map((conveyor) => (
    conveyor.id === id
      ? normalizeConveyor({
        ...conveyor,
        ...updates,
      })
      : conveyor
  ))
);

export const removeConveyor = (conveyors = [], id) => (
  updateConveyor(conveyors, id, { isRemoved: true })
);

export const restoreConveyor = (conveyors = [], id) => (
  updateConveyor(conveyors, id, { isRemoved: false })
);
