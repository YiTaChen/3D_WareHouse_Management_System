export const PORT_DIRECTIONS = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
};

export const portConfigs = {
  Port1: {
    id: 'Port1',
    directions: [PORT_DIRECTIONS.INBOUND],
    spawnPositions: {
      [PORT_DIRECTIONS.INBOUND]: [-8, 4, -8],
    },
    inboundShelfZPositions: [-8, -4],
    conveyorId: 'conv1',
    craneId: 'crane001',
  },
  Port2: {
    id: 'Port2',
    directions: [PORT_DIRECTIONS.OUTBOUND],
    spawnPositions: {
      [PORT_DIRECTIONS.OUTBOUND]: [6, 5, -8],
    },
    conveyorId: 'conv4',
    craneId: 'crane001',
  },
  Port3: {
    id: 'Port3',
    directions: [PORT_DIRECTIONS.INBOUND, PORT_DIRECTIONS.OUTBOUND],
    spawnPositions: {
      [PORT_DIRECTIONS.INBOUND]: [-8, 4, 2],
      [PORT_DIRECTIONS.OUTBOUND]: [6, 5, 2],
    },
    inboundShelfZPositions: [-2, 2],
    conveyorId: 'conv7',
    craneId: 'crane002',
  },
  Port4: {
    id: 'Port4',
    directions: [PORT_DIRECTIONS.INBOUND],
    spawnPositions: {
      [PORT_DIRECTIONS.INBOUND]: [-8, 4, 8],
    },
    inboundShelfZPositions: [4],
    conveyorId: 'conv10',
    craneId: 'crane003',
  },
  Port5: {
    id: 'Port5',
    directions: [PORT_DIRECTIONS.OUTBOUND],
    spawnPositions: {
      [PORT_DIRECTIONS.OUTBOUND]: [6, 5, 4],
    },
    conveyorId: 'conv19',
    craneId: 'crane003',
  },
};

export const portOptionsByDirection = {
  [PORT_DIRECTIONS.INBOUND]: ['Port1', 'Port3', 'Port4'],
  [PORT_DIRECTIONS.OUTBOUND]: ['Port2', 'Port3', 'Port5'],
};

export const getPortSpawnPosition = (portId, direction) =>
  portConfigs[portId]?.spawnPositions?.[direction] ?? [0, 0, 0];

export const getPortConveyorId = (portId) => portConfigs[portId]?.conveyorId ?? '';

export const getInboundShelfZPositions = (portId) =>
  portConfigs[portId]?.inboundShelfZPositions ?? [];
