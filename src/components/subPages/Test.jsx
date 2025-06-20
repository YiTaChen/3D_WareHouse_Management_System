import { useCraneStore } from '../../stores/craneStore.js';
import { useState } from 'react';
import * as THREE from 'three';

export default function CraneControlPanel() {

  const [selectedCraneId, setSelectedCraneId] = useState('crane001');
  const setCraneTargetPosition = useCraneStore(state => state.setCraneTargetPosition);
  const setMoveTableTargetLocalOffset = useCraneStore(state => state.setMoveTableTargetLocalOffset);
  // const craneState = useCraneStore(state => state.getCraneState('crane001')); // 獲取指定 Crane 的狀態

  const craneStates = useCraneStore(state => state.craneStates);

  const craneIds = Object.keys(craneStates);
  const craneState = craneStates[selectedCraneId];

  // 移動整個 Crane 到 (5, 3, 0)
  const moveWholeCrane = () => {
    setCraneTargetPosition('crane001', [1, 3, -8], 2); // ID, 目標位置, 速度
  };

  // 移動 moveTable 相對於 Crane 根部在 Y 軸上向下移動 1 單位
  const moveMoveTableDown = () => {
    // 假設 Crane 的初始 moveTable 偏移是 (0,0,0)
    // 這裡我們將其目標偏移設定為 (0, -1, 0)
    setMoveTableTargetLocalOffset('crane001', [0, -1, 0], 0.5); // ID, 目標本地偏移, 速度
  };

  // 移動 moveTable 相對於 Crane 根部在 Y 軸上向上移動 1 單位 (回到原位)
  const moveMoveTableUp = () => {
    setMoveTableTargetLocalOffset('crane001', [0, 1, 0], 0.5);
  };

  const renderVector = (vec) =>
    Array.isArray(vec) ? vec.map(n => n.toFixed(2)).join(', ') : 'N/A';

 const getMoveTableWorldPosition = () => {
    if (!craneState) {
      console.log('craneState 不存在');
      return 'N/A';
    }

    const { currentCranePosition, rotation, currentMoveTableLocalOffset, targetMoveTableLocalOffset } = craneState;

    console.log('currentCranePosition:', currentCranePosition?.toArray());
    console.log('rotation:', rotation?.toArray ? rotation.toArray() : rotation);
    console.log('currentMoveTableLocalOffset:', currentMoveTableLocalOffset?.toArray());
    console.log('targetMoveTableLocalOffset:', targetMoveTableLocalOffset?.toArray());

    const cranePos = currentCranePosition.clone();
    const craneRot = new THREE.Euler(...rotation.toArray());
    const craneQuat = new THREE.Quaternion().setFromEuler(craneRot);

    const currentOffset = currentMoveTableLocalOffset.clone().applyQuaternion(craneQuat);
    const targetOffset = targetMoveTableLocalOffset.clone().applyQuaternion(craneQuat);

    const currentWorld = cranePos.clone().add(currentOffset);
    const targetWorld = cranePos.clone().add(targetOffset);

    console.log('currentWorld:', currentWorld.toArray());
    console.log('targetWorld:', targetWorld.toArray());

    return {
      current: currentWorld.toArray().map(n => n.toFixed(2)).join(', '),
      target: targetWorld.toArray().map(n => n.toFixed(2)).join(', ')
    };
  };


  const moveTableWorld = getMoveTableWorldPosition();


  return (
    <div style={{ padding: '1em', background: '#f5f5f5', border: '1px solid #ccc', width: '300px' }}>
      <h3>Crane Control Panel</h3>

      <label htmlFor="crane-select">Select Crane:</label>
      <select
        id="crane-select"
        value={selectedCraneId}
        onChange={(e) => setSelectedCraneId(e.target.value)}
      >
        {craneIds.map(id => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>

      <div style={{ marginTop: '1em' }}>
        <button onClick={moveWholeCrane}>Move Whole Crane</button>
        <button onClick={moveMoveTableDown}>Move MoveTable Down</button>
        <button onClick={moveMoveTableUp}>Move MoveTable Up</button>
      </div>

      {craneState && (
        <div style={{ marginTop: '1em' }}>
          <h4>Crane Status</h4>
          <p><strong>Crane Position:</strong> {craneState.currentCranePosition.toArray().map(n => n.toFixed(2)).join(', ')}</p>
          <p><strong>Crane Target:</strong> {craneState.targetCranePosition.toArray().map(n => n.toFixed(2)).join(', ')}</p>
          <p><strong>Crane Speed:</strong> {craneState.craneMoveSpeed}</p>
          <p><strong>Crane Moving:</strong> {craneState.isCraneMoving ? 'Yes' : 'No'}</p>

          <h4>MoveTable Status</h4>
          <p><strong>Current Offset:</strong> {craneState.currentMoveTableLocalOffset.toArray().map(n => n.toFixed(2)).join(', ')}</p>
          <p><strong>Target Offset:</strong> {craneState.targetMoveTableLocalOffset.toArray().map(n => n.toFixed(2)).join(', ')}</p>
          <p><strong>MoveTable Speed:</strong> {craneState.moveTableSpeed}</p>
          <p><strong>MoveTable Moving:</strong> {craneState.isMoveTableMoving ? 'Yes' : 'No'}</p>

          <p>MoveTable Offset: {renderVector(craneState.currentMoveTableLocalOffset.toArray())}</p>
          <p>MoveTable Target Offset: {renderVector(craneState.targetMoveTableLocalOffset.toArray())}</p>
          <p>MoveTable is moving: {craneState.isMoveTableMoving ? 'Yes' : 'No'}</p>

          <p>MoveTable World Pos: {moveTableWorld.current}</p>
          <p>MoveTable Target Pos: {moveTableWorld.target}</p>
        </div>
      )}
    </div>
  );
}

