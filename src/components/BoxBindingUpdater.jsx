import { useEffect } from 'react';
import * as THREE from 'three';
import { useCraneStore } from '../stores/craneStore';
import { useBoxStore } from '../stores/boxStore';
import { useFrame } from '@react-three/fiber';

const BINDING_CONFIG = {
  verticalOffset: 0.6,
  maxBindingAttempts: 60,
  positionCheckTolerance: 0.001
};
export default function BoxBindingUpdater  () {
  const getCraneState = useCraneStore((state) => state.getCraneState);
  const getBoxRef = useBoxStore((state) => state.getBoxRef);
  const boxesData = useBoxStore((state) => state.boxesData);
  const getBoxBoundMoveplate = useBoxStore((state) => state.getBoxBoundMoveplate); // ✅ 正確來源

  useFrame(() => {
    if (!boxesData) return;

    Object.keys(boxesData).forEach((boxId) => {
      const boundCraneId = getBoxBoundMoveplate(boxId); // ✅ 改用此處
      if (!boundCraneId) return;

      const craneState = getCraneState(boundCraneId);
      const boxRef = getBoxRef(boxId);

      if (!craneState || !craneState.currentCranePosition || !craneState.currentMoveTableLocalOffset || !boxRef?.api?.position?.set) return;

      try {
        const cranePos = craneState.currentCranePosition.clone();
        const craneRot = new THREE.Euler(...craneState.rotation.toArray());
        const craneQuat = new THREE.Quaternion().setFromEuler(craneRot);
        const moveOffset = craneState.currentMoveTableLocalOffset.clone().applyQuaternion(craneQuat);
        const moveWorld = cranePos.clone().add(moveOffset);

        boxRef.api.position.set(
          moveWorld.x,
          moveWorld.y + BINDING_CONFIG.verticalOffset,
          moveWorld.z
        );
        boxRef.api.velocity.set(0, 0, 0);
      } catch (err) {
        console.warn(`[BoxBindingUpdater] Failed to bind ${boxId}:`, err);
      }
    });
  });

  return null;
};