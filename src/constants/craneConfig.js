

export const CRANE_CONSTANTS = {
  DEFAULT_CRANE_SPEED: 2.0,       // 吊車主體移動的預設速度 (m/s)
  DEFAULT_TABLE_SPEED: 1.0,       // 吊車平台移動的預設速度 (m/s)

  // 平台完全收回時的局部坐標偏移量（相對於 Crane 本體）
  // 假設 Crane 的 MovePlate 歸位時，x 軸回到 0，y 軸回到一個預設高度，z 軸回到 0
  COLLECT_PLATE_X_OFFSET: 0,
  COLLECT_PLATE_Y_OFFSET: 1.0,
  COLLECT_PLATE_Z_OFFSET: 0,

  // 在貨架上取放貨時，Box 底部相對於貨架 Y 軸位置的偏移量
  // 假設 Box 有一定高度，平台需要伸到 Box 底部以精準取放
  PICK_AND_PUT_Y_OFFSET: 0.3,

  // AS/RS stacker crane 尺寸與運動契約（Three.js: X 行走、Y 升降、Z 伸叉）
  BASE_Y: 0,
  FORK_SIDE_REACH: 2,
  // shelfStore 的 Y 比層板中心高 1 m；低叉位因此是 shelfPositionY - 1 m。
  SHELF_TO_FORK_LOW_OFFSET: -1.0,
  BOX_BINDING_VERTICAL_OFFSET: 0.58,
  SHELF_GRID: 2,
  BOX_SIZE: 1,
  BODY_WIDTH_IN_CELL: 1.8,
  MAST_INNER_CLEARANCE: 1.22,
  FORK_OUTER_WIDTH: 0.6,
  FORK_TINE_LENGTH: 0.9,
};

export const toCraneBasePosition = ([x, , z]) => [x, CRANE_CONSTANTS.BASE_Y, z];

export const getShelfLiftRelativeOffset = (shelfPosition) => {
  return shelfPosition[1] + CRANE_CONSTANTS.SHELF_TO_FORK_LOW_OFFSET;
};

export const getPortLiftRelativeOffset = (portPosition) =>
  portPosition[1] - CRANE_CONSTANTS.BASE_Y;
