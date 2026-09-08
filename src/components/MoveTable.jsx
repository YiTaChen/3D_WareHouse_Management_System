import React, { useMemo, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useCraneStore } from '../stores/craneStore';
import { useFrame } from '@react-three/fiber';
import { CraneData } from '../data/CraneData';
import {
  getForkVisualExtensionTransform,
  writeFixedForkCraneBase,
} from '../constants/craneConfig.js';

// 幫助取得 local 尺寸
function getLocalBoundingBoxSize(object) {
  if (!object) return [1, 1, 1];
  const bbox = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  return size.toArray();
}

export default function MoveTable({
  id,
  craneWorldRotation,
  modelPath = '/asrs_fork_table.glb',
  colliderSize,
}) {
  const { scene } = useGLTF(modelPath);

  // Split the replacement asset into a fixed carriage/guide assembly and the
  // two inner extending tines. The original plateTable physics body remains a
  // single invisible kinematic collider at the full mission offset.
  const { fixedAssemblyMesh, extendingTinesMesh, moveTableLocalProps } = useMemo(() => {
    const movePlate = scene.getObjectByName('movePlate');
    const fixedAssembly = movePlate?.getObjectByName('ForkFixedAssembly');
    const extendingTines = movePlate?.getObjectByName('ForkExtendingTines');
    if (!movePlate || !fixedAssembly || !extendingTines) {
      console.warn('movePlate mesh not found in GLTF');
      return {
        fixedAssemblyMesh: null,
        extendingTinesMesh: null,
        moveTableLocalProps: { args: [1, 1, 1] },
      };
    }
    const size = colliderSize || getLocalBoundingBoxSize(movePlate);
    const fixedClone = fixedAssembly.clone(true);
    const nestedExtendingClone = fixedClone.getObjectByName('ForkExtendingTines');
    nestedExtendingClone?.parent?.remove(nestedExtendingClone);
    return {
      fixedAssemblyMesh: fixedClone,
      extendingTinesMesh: extendingTines.clone(true),
      moveTableLocalProps: { args: size },
    };
  }, [scene, colliderSize]);


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
  const fixedAssemblyRef = useRef(null);
  const extendingTinesRef = useRef(null);
  const fixedVisualScratch = useMemo(() => ({
    fixedLocalOffset: new THREE.Vector3(),
    fixedWorldPosition: new THREE.Vector3(),
  }), []);

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

    // Crane (-2) and fork (-1) share the current mission state; never mix
    // delayed Cannon X/Z with current logical lift Y under the 450-cell load.
    const fixedWorldPos = writeFixedForkCraneBase(
      fixedVisualScratch.fixedWorldPosition, liveCranePosition.toArray(),
    );
    const fixedLocalOffset = fixedVisualScratch.fixedLocalOffset.copy(nextTableOffset);
    const extensionZ = fixedLocalOffset.z;
    fixedLocalOffset.z = 0;
    fixedWorldPos.add(fixedLocalOffset.applyQuaternion(craneQuat));

    if (fixedAssemblyRef.current) {
      fixedAssemblyRef.current.position.copy(fixedWorldPos);
      fixedAssemblyRef.current.quaternion.copy(craneQuat);
    }

    if (extendingTinesRef.current) {
      const { positionZ, scaleZ } = getForkVisualExtensionTransform(extensionZ);
      extendingTinesRef.current.position.set(0, 0, positionZ);
      extendingTinesRef.current.scale.set(1, 1, scaleZ);
    }

  }, -1);

  return (
    <>
      <group ref={moveTableRef} visible={false} />
      <group ref={moveTableVisualRef} visible={false} />
      {fixedAssemblyMesh && extendingTinesMesh && (
        <group ref={fixedAssemblyRef}>
          <primitive object={fixedAssemblyMesh} />
          <group ref={extendingTinesRef}>
            <primitive object={extendingTinesMesh} />
          </group>
        </group>
      )}
    </>
  );
}
