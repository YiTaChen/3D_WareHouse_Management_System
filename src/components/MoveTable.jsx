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
  craneBodyRef,
  craneWorldPosition,
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
  const currentMoveTableLocalOffset = useCraneStore(state => state.getCraneState(id).currentMoveTableLocalOffset);
  const targetMoveTableLocalOffset = useCraneStore(state => state.getCraneState(id).targetMoveTableLocalOffset);
  const moveTableSpeed = useCraneStore(state => state.getCraneState(id).moveTableSpeed);
  const isCraneMoving = useCraneStore(state => state.getCraneState(id).isCraneMoving);
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
  const fixedAssemblyRef = useRef(null);
  const extendingTinesRef = useRef(null);
  const fixedVisualScratch = useMemo(() => ({
    craneEuler: new THREE.Euler(),
    craneQuaternion: new THREE.Quaternion(),
    physicalCranePosition: new THREE.Vector3(),
    fixedLocalOffset: new THREE.Vector3(),
    fixedWorldPosition: new THREE.Vector3(),
  }), []);

  // 在 Ref 有效時，註冊進 Store
  useEffect(() => {
    if (moveTableRef.current && moveTableApi) {
      setMoveTableRef(id, {
        ref: moveTableRef,
        api: moveTableApi,
        isReady: true,
      });
    }
    return () => setMoveTableRef(id, null);
  }, [id, moveTableRef, moveTableApi, setMoveTableRef]);

  // 每幀更新物理剛體位置
  useFrame((_, delta) => {
    if (!moveTableApi) return;

    const nextInputs = [
      ...craneWorldPosition,
      ...craneWorldRotation,
      ...currentMoveTableLocalOffset.toArray(),
    ];
    const inputsChanged = !lastPhysicsInputs.current || nextInputs.some(
      (value, index) => value !== lastPhysicsInputs.current[index]
    );

    if (inputsChanged) {
      const cranePos = new THREE.Vector3(...craneWorldPosition);
      const craneQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...craneWorldRotation));
      const localOffset = currentMoveTableLocalOffset.clone().applyQuaternion(craneQuat);
      const worldPos = cranePos.add(localOffset);

      moveTableApi.position.set(worldPos.x, worldPos.y, worldPos.z);
      moveTableApi.quaternion.set(craneQuat.x, craneQuat.y, craneQuat.z, craneQuat.w);
      lastPhysicsInputs.current = nextInputs;
    }

    // Follow the live kinematic body every frame. Store/React updates can land
    // a frame later than Cannon's body movement; using only changed props here
    // can leave the detached visual at an old travel position.
    const craneQuat = fixedVisualScratch.craneQuaternion.setFromEuler(
      fixedVisualScratch.craneEuler.set(...craneWorldRotation)
    );
    const physicalCranePosition = craneBodyRef?.current
      ? craneBodyRef.current.getWorldPosition(fixedVisualScratch.physicalCranePosition)
      : null;
    const fixedWorldPos = writeFixedForkCraneBase(
      fixedVisualScratch.fixedWorldPosition,
      craneWorldPosition,
      physicalCranePosition,
    );
    const fixedLocalOffset = fixedVisualScratch.fixedLocalOffset.copy(
      currentMoveTableLocalOffset
    );
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

    const shouldMoveTable = !isCraneMoving && !currentMoveTableLocalOffset.equals(targetMoveTableLocalOffset);
    if (shouldMoveTable) {
      const distance = currentMoveTableLocalOffset.distanceTo(targetMoveTableLocalOffset);
      const moveDistance = moveTableSpeed * delta;

      if (moveDistance >= distance) {
        updateMoveTableCurrentLocalOffset(id, targetMoveTableLocalOffset.toArray());
      } else {
        const direction = targetMoveTableLocalOffset.clone().sub(currentMoveTableLocalOffset).normalize();
        const newOffset = currentMoveTableLocalOffset.clone().add(direction.multiplyScalar(moveDistance));
        updateMoveTableCurrentLocalOffset(id, newOffset.toArray());
      }
    }
  });

  return (
    <>
      <group ref={moveTableRef} />
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
