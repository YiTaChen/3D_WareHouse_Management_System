
// 通用步驟模板定義
export const stepTemplates = {
  MOVE_CRANE_TO: { functionKey: 'moveCrane', name: 'Crane move' },
  MOVE_CRANE_TABLE_TO: { functionKey: 'moveCraneTable', name: 'Move Crane Table' },
  CRANE_BIND_BOX: { functionKey: 'craneBindingBox', name: 'Binding box' },
  CRANE_UNBIND_BOX: { functionKey: 'craneUnBindingBox', name: 'Unbind box' },
  MOVE_BOX_ON_CONVEYOR: { functionKey: 'moveBoxOnConveyor', name: 'Move Box on Conveyor' },
  BOX_LEAVE_CONVEYOR: { functionKey: 'boxLeaveConveyor', name: 'Box Leave Conveyor' },
  BOX_ARRIVE_ON_CONVEYOR: { functionKey: 'boxArriveOnConveyor', name: 'Box Arrive on Conveyor' },
};

// 任務模板集合 (由多個步驟模板組成)
export const taskTemplates = {
  // --- 通用 Crane 移動任務 ---
  MOVE_CRANE_TO_TARGET: [
    { name: 'Crane move to target', template: stepTemplates.MOVE_CRANE_TO, overrides: { speed: 3 } },
  ],
  CRANE_RETURN_HOME: [
    { name: 'Crane move back', template: stepTemplates.MOVE_CRANE_TO, overrides: { speed: 3 } },
  ],

  // --- 從輸送帶取貨任務 (Inbound) ---
  WAIT_BOX_AT_CRANE_PICKUP: [
    { name: 'Box move on inbound conveyors', template: stepTemplates.MOVE_BOX_ON_CONVEYOR },
    { name: 'Box arrive at crane pickup point', template: stepTemplates.BOX_ARRIVE_ON_CONVEYOR }, // Box 停在輸送帶上，等待 Crane
  ],
  PICK_FROM_CONVEYOR: [
    { name: 'Crane move to conveyor pickup point', template: stepTemplates.MOVE_CRANE_TO_TARGET }, // Crane 移動到取貨輸送帶旁
    { name: 'extend platform to take box from conveyor', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'upward to take box from conveyor', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'Binding box', template: stepTemplates.CRANE_BIND_BOX },
    { name: 'Box leave conveyor', template: stepTemplates.BOX_LEAVE_CONVEYOR }, // Box 從輸送帶上「消失」
    { name: 'collect platform after pickup', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'downward to original position after pickup', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
  ],

  // --- 放置貨物到貨架任務 (Inbound) ---
  PUT_ON_SHELF: [
    { name: 'upward extend platform', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'extend platform to shelf', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'Unbind box', template: stepTemplates.CRANE_UNBIND_BOX },
    { name: 'downward platform', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'collect platform', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
  ],

  // --- 從貨架取貨任務 (Outbound) ---
  PICK_FROM_SHELF: [
    { name: 'upward extend platform to take box from shelf', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'extend platform to take box from shelf', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'Binding box', template: stepTemplates.CRANE_BIND_BOX },
    { name: 'collect platform after pickup from shelf', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'downward to original position after pickup from shelf', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
  ],

  // --- 放置貨物到輸送帶任務 (Outbound) ---
  PUT_ON_CONVEYOR: [
    { name: 'upward extend platform before drop', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'extend platform to conveyor drop point', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'Unbind box', template: stepTemplates.CRANE_UNBIND_BOX },
    { name: 'Box arrive on conveyor', template: stepTemplates.BOX_ARRIVE_ON_CONVEYOR }, // Box 到達輸送帶上
    { name: 'downward platform after drop', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
    { name: 'collect platform after drop', template: stepTemplates.MOVE_CRANE_TABLE_TO, overrides: { speed: 1 } },
  ],
  MOVE_BOX_ON_OUTBOUND_CONVEYOR: [
    { name: 'Box move on outbound conveyors', template: stepTemplates.MOVE_BOX_ON_CONVEYOR },
  ],
};

// 完整的 Mission 流程定義
export const missionTemplates = {
  // 入庫任務 (從 Port 經輸送帶到 Crane，再到 Shelf)
  INBOUND_TO_SHELF: {
    id: 'inbound_to_shelf',
    name: '入庫任務 (Port to Shelf)',
    tasks: [
      { id: 'inbound_task1_wait_box_at_crane_pickup', name: '1. 等待 Box 到達 Crane 取貨點', template: taskTemplates.WAIT_BOX_AT_CRANE_PICKUP },
      { id: 'inbound_task2_crane_pickup', name: '2. Crane 從輸送帶取貨', template: taskTemplates.PICK_FROM_CONVEYOR },
      { id: 'inbound_task3_crane_move_to_shelf', name: '3. Crane 移動到貨架', template: taskTemplates.MOVE_CRANE_TO_TARGET },
      { id: 'inbound_task4_put_on_shelf', name: '4. 放置貨物到貨架', template: taskTemplates.PUT_ON_SHELF },
      { id: 'inbound_task5_crane_return_home', name: '5. Crane 返回歸位', template: taskTemplates.CRANE_RETURN_HOME },
    ],
  },
  // 出庫任務 (從 Shelf 到 Crane，再經輸送帶到 Port)
  OUTBOUND_FROM_SHELF: {
    id: 'outbound_from_shelf',
    name: '出庫任務 (Shelf to Port)',
    tasks: [
      { id: 'outbound_task1_crane_move_to_shelf', name: '1. Crane 移動到貨架', template: taskTemplates.MOVE_CRANE_TO_TARGET },
      { id: 'outbound_task2_pick_from_shelf', name: '2. Crane 從貨架取貨', template: taskTemplates.PICK_FROM_SHELF },
      { id: 'outbound_task3_crane_move_to_conveyor_drop', name: '3. Crane 移動到輸送帶放置點', template: taskTemplates.MOVE_CRANE_TO_TARGET },
      { id: 'outbound_task4_put_on_conveyor', name: '4. 放置貨物到輸送帶', template: taskTemplates.PUT_ON_CONVEYOR },
      { id: 'outbound_task5_move_box_on_outbound_conveyor', name: '5. Box 沿輸送帶出庫', template: taskTemplates.MOVE_BOX_ON_OUTBOUND_CONVEYOR },
      { id: 'outbound_task6_crane_return_home', name: '6. Crane 返回歸位', template: taskTemplates.CRANE_RETURN_HOME },
    ],
  },
  
};

