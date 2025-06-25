import React, { useMemo, useEffect } from 'react';
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

export default function MoveTable({ id, craneWorldPosition, craneWorldRotation }) {
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

    const cranePos = new THREE.Vector3(...craneWorldPosition);
    const craneRot = new THREE.Euler(...craneWorldRotation);
    const craneQuat = new THREE.Quaternion().setFromEuler(craneRot);

    const localOffset = currentMoveTableLocalOffset.clone().applyQuaternion(craneQuat);
    const worldPos = cranePos.clone().add(localOffset);

    moveTableApi.position.set(worldPos.x, worldPos.y, worldPos.z);
    moveTableApi.quaternion.set(craneQuat.x, craneQuat.y, craneQuat.z, craneQuat.w);

    // 控制 moveTable 內部滑動
    if (!isCraneMoving && !currentMoveTableLocalOffset.equals(targetMoveTableLocalOffset)) {
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
      {moveTableMesh && (
        <group ref={moveTableRef}>
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
