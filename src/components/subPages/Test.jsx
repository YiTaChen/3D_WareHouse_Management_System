import { useCraneStore } from '../../stores/craneStore.js';

export default function CraneControlPanel() {
  const setCraneTargetPosition = useCraneStore(state => state.setCraneTargetPosition);
  const setMoveTableTargetLocalOffset = useCraneStore(state => state.setMoveTableTargetLocalOffset);
  const craneState = useCraneStore(state => state.getCraneState('crane001')); // 獲取指定 Crane 的狀態

  // 移動整個 Crane 到 (5, 3, 0)
  const moveWholeCrane = () => {
    setCraneTargetPosition('crane001', [5, 3, 0], 2); // ID, 目標位置, 速度
  };

  // 移動 moveTable 相對於 Crane 根部在 Y 軸上向下移動 1 單位
  const moveMoveTableDown = () => {
    // 假設 Crane 的初始 moveTable 偏移是 (0,0,0)
    // 這裡我們將其目標偏移設定為 (0, -1, 0)
    setMoveTableTargetLocalOffset('crane001', [0, -1, 0], 0.5); // ID, 目標本地偏移, 速度
  };

  // 移動 moveTable 相對於 Crane 根部在 Y 軸上向上移動 1 單位 (回到原位)
  const moveMoveTableUp = () => {
    setMoveTableTargetLocalOffset('crane001', [0, 0, 0], 0.5);
  };

  return (
    <div>
      <button onClick={moveWholeCrane}>Move Whole Crane</button>
      <button onClick={moveMoveTableDown}>Move MoveTable Down</button>
      <button onClick={moveMoveTableUp}>Move MoveTable Up</button>
      <p>Crane is moving: {craneState?.isCraneMoving ? 'Yes' : 'No'}</p>
      <p>MoveTable is moving: {craneState?.isMoveTableMoving ? 'Yes' : 'No'}</p>
    </div>
  );
}

