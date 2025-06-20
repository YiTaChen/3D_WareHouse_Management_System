import { useCallback, useEffect, useRef, useState } from 'react';
import { useCraneStore } from '../stores/craneStore';
import { useBoxStore } from '../stores/boxStore';
import * as THREE from 'three';

const BINDING_CONFIG = {
  verticalOffset: 0.6
};

export const useObjectBindingPosition = (craneId, boxId) => {
  const getMoveTableRef = useCraneStore(state => state.getMoveTableRef);
  const getCraneState = useCraneStore(state => state.getCraneState);
  const getBoxRef = useBoxStore(state => state.getBoxRef);
  const setBoxBoundToMoveplate = useBoxStore(state => state.setBoxBoundToMoveplate);
  const removeBoxBoundToMoveplate = useBoxStore(state => state.removeBoxBoundToMoveplate);

  const [isBound, setIsBound] = useState(false);
  const [bindingError, setBindingError] = useState(null);

  const refs = useRef({});

  // 更新 ref 快照
  useEffect(() => {
    refs.current.moveTable = getMoveTableRef(craneId);
    refs.current.box = getBoxRef(boxId);
  }, [craneId, boxId, getMoveTableRef, getBoxRef]);

  const forceBind = useCallback(() => {
    const movePlateRef = getMoveTableRef(craneId);
    const boxRef = getBoxRef(boxId);

    if (!movePlateRef?.ref?.current || !boxRef?.ref?.current || !boxRef.api) {
      setBindingError("Force bind failed: ref/api not ready");
      return;
    }

    const craneState = getCraneState(craneId);
    if (!craneState) {
      setBindingError("Crane state not available");
      return;
    }

    const cranePos = craneState.currentCranePosition.clone();
    const craneRot = new THREE.Euler(...craneState.rotation.toArray());
    const craneQuat = new THREE.Quaternion().setFromEuler(craneRot);
    const moveOffset = craneState.currentMoveTableLocalOffset.clone().applyQuaternion(craneQuat);
    const moveWorld = cranePos.clone().add(moveOffset);

    const boxApi = boxRef.api;
    boxApi.position.set(moveWorld.x, moveWorld.y + BINDING_CONFIG.verticalOffset, moveWorld.z);
    boxApi.velocity.set(0, 0, 0);

    refs.current.box = boxRef;
    refs.current.moveTable = movePlateRef;
    setBoxBoundToMoveplate(boxId, craneId);
    setIsBound(true);
    setBindingError(null);
  }, [boxId, craneId, getMoveTableRef, getBoxRef, getCraneState, setBoxBoundToMoveplate]);

  const handleBind = useCallback(() => {
    forceBind();
  }, [forceBind]);

  const handleUnbind = useCallback(() => {
    const boxRef = refs.current.box;
    if (boxRef?.api) {
      if (boxRef.api.mass?.set) boxRef.api.mass.set(1);
      if (boxRef.api.type?.set) boxRef.api.type.set('Dynamic');
      if (boxRef.api.wakeUp) boxRef.api.wakeUp();
    }
    removeBoxBoundToMoveplate(boxId);
    setIsBound(false);
  }, [boxId, removeBoxBoundToMoveplate]);

  return {
    handleBind,
    handleUnbind,
    forceBind,
    isBound,
    bindingError
  };
};
