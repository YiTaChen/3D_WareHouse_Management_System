

export const CRANE_CONSTANTS = {
  DEFAULT_CRANE_SPEED: 2.0,       // 吊車主體移動的預設速度 (m/s)
  DEFAULT_TABLE_SPEED: 1.0,       // 吊車平台移動的預設速度 (m/s)

  // 平台完全收回時的局部坐標偏移量（相對於 Crane 本體）
  // 假設 Crane 的 MovePlate 歸位時，x 軸回到 0，y 軸回到一個預設高度，z 軸回到 0
  COLLECT_PLATE_X_OFFSET: 0,
  COLLECT_PLATE_Y_OFFSET: 0.1,    // 平台收回時的高度 (例如，比 Crane 自身 Y 軸高 0.1m)
  COLLECT_PLATE_Z_OFFSET: 0,

  // 在貨架上取放貨時，Box 底部相對於貨架 Y 軸位置的偏移量
  // 假設 Box 有一定高度，平台需要伸到 Box 底部以精準取放
  PICK_AND_PUT_Y_OFFSET: 0.15,    // 假設 Box 高度的一半或底部離地面的高度
};

