import React, { useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useCraneStore } from '../stores/craneStore';
import { useFrame } from '@react-three/fiber';
import { CraneData } from '../data/CraneData';

// 幫助取得 local 尺寸
function getLocalBoundingBoxSize(mesh) {
  if (!mesh || !mesh.geometry) return [1, 1, 1];
  const bbox = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  return size.toArray();
}

export default function MoveTable({ id, craneWorldRotation }) {
  const { scene } = useGLTF('/moveTable_ver2.gltf');

  // 取出 movePlate Mesh 與碰撞體尺寸
  const { moveTableMesh, moveTableLocalProps } = useMemo(() => {
    const mesh = scene.getObjectByName('movePlate');
    if (!mesh) {
      console.warn('movePlate mesh not found in GLTF');
      return { moveTableMesh: null, moveTableLocalProps: { args: [1, 1, 1] } };
    }
    const size = getLocalBoundingBoxSize(mesh);
    return {
      moveTableMesh: mesh.clone(),
      moveTableLocalProps: { args: size },
    };
  }, [scene]);


  const moveTableInitialPosition = useMemo(() => {
  const craneConfig = CraneData.cranes.find(c => c.id === id);
  return craneConfig?.moveTableInitialPosition || [0, 3, -10];
}, [id]);



  // Zustand 讀取狀態
  const setMoveTableRef = useCraneStore(state => state.setMoveTableRef);
  const updateMoveTableCurrentLocalOffset = useCraneStore(state => state.updateMoveTableCurrentLocalOffset);

  // 建立剛體 Ref，初始位置暫時設為原點，由 useFrame 控制
  const [moveTableRef, moveTableApi] = useBox(() => ({
    type: 'Kinematic',
    mass: 0,
    // position: [0, 3, -10], // 初始位置，稍後會在 useFrame 中更新 // 要另外讀取 craneWorldPosition
    position: moveTableInitialPosition, // 初始位置，稍後會在 useFrame 中更新 // 要另外讀取 craneWorldPosition


    args: moveTableLocalProps.args,
    material: 'craneTable',
    userData: { id: `movePlate-${id}`, args: moveTableLocalProps.args },
  }));
  const lastPhysicsInputs = useRef(null);
  const moveTableVisualRef = useRef(null);

  useLayoutEffect(() => {
    const craneState = useCraneStore.getState().getCraneState(id);
    if (!craneState || !moveTableVisualRef.current) return;

    const craneQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...craneWorldRotation));
    const worldPosition = craneState.currentCranePosition.clone().add(
      craneState.currentMoveTableLocalOffset.clone().applyQuaternion(craneQuat),
    );

    moveTableVisualRef.current.position.copy(worldPosition);
    moveTableVisualRef.current.quaternion.copy(craneQuat);
  }, [craneWorldRotation, id]);

  // 在 Ref 有效時，註冊進 Store
  useEffect(() => {
    if (moveTableRef.current && moveTableApi) {
      setMoveTableRef(id, {
        ref: moveTableRef,
        visualRef: moveTableVisualRef,
        api: moveTableApi,
        isReady: true,
      });
    }
    return () => setMoveTableRef(id, null);
  }, [id, moveTableRef, moveTableApi, setMoveTableRef]);

  // 每幀更新物理剛體位置
  useFrame((_, delta) => {
    if (!moveTableApi) return;

    const liveCraneState = useCraneStore.getState().getCraneState(id);
    if (!liveCraneState) return;

    const liveCranePosition = liveCraneState.currentCranePosition;
    const liveTableOffset = liveCraneState.currentMoveTableLocalOffset;
    const shouldMoveTable = !liveCraneState.isCraneMoving
      && !liveTableOffset.equals(liveCraneState.targetMoveTableLocalOffset);
    let nextTableOffset = liveTableOffset;

    if (shouldMoveTable) {
      const distance = liveTableOffset.distanceTo(liveCraneState.targetMoveTableLocalOffset);
      const moveDistance = liveCraneState.moveTableSpeed * delta;

      nextTableOffset = moveDistance >= distance
        ? liveCraneState.targetMoveTableLocalOffset
        : liveTableOffset.clone().add(
          liveCraneState.targetMoveTableLocalOffset
            .clone()
            .sub(liveTableOffset)
            .normalize()
            .multiplyScalar(moveDistance)
        );

      updateMoveTableCurrentLocalOffset(id, nextTableOffset.toArray());
    }

    const nextInputs = [
      ...liveCranePosition.toArray(),
      ...craneWorldRotation,
      ...nextTableOffset.toArray(),
    ];
    const inputsChanged = !lastPhysicsInputs.current || nextInputs.some(
      (value, index) => value !== lastPhysicsInputs.current[index]
    );

    const craneQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...craneWorldRotation));
    const localOffset = nextTableOffset.clone().applyQuaternion(craneQuat);
    const worldPos = liveCranePosition.clone().add(localOffset);

    if (moveTableVisualRef.current) {
      moveTableVisualRef.current.position.copy(worldPos);
      moveTableVisualRef.current.quaternion.copy(craneQuat);
    }

    if (inputsChanged) {
      moveTableApi.position.set(worldPos.x, worldPos.y, worldPos.z);
      moveTableApi.quaternion.set(craneQuat.x, craneQuat.y, craneQuat.z, craneQuat.w);
      lastPhysicsInputs.current = nextInputs;
    }
  }, -1);

  return (
    <>
      <group ref={moveTableRef} visible={false} />
      {moveTableMesh && (
        <group ref={moveTableVisualRef}>
          <primitive object={moveTableMesh} />
          {moveTableLocalProps?.args && (
            <mesh>
              <boxGeometry args={moveTableLocalProps.args} />
              <meshBasicMaterial color="orange" wireframe opacity={0.5} transparent />
            </mesh>
          )}
        </group>
      )}
    </>
  );
}
