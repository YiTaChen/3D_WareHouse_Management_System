import React, { useMemo, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useCraneStore } from '../stores/craneStore';
import { useFrame } from '@react-three/fiber';
import MoveTable from './MoveTable';
import CraneInvisibleBulkSensor from './CraneInvisibleBulkSensor';


export default function Crane({ id, modelPath, rotation }) {
  const { scene } = useGLTF(modelPath || '/Crane_ver1.gltf'); 

  const setCraneSensorDetected = useCraneStore(state => state.setCraneSensorDetected);
  
  const {
    currentCranePosition,
    targetCranePosition,
    craneMoveSpeed,
    isMoveTableMoving, 
  } = useCraneStore(state => state.getCraneState(id));

  const updateCraneCurrentPosition = useCraneStore(state => state.updateCraneCurrentPosition);

  const hasSetInitialPosition = useRef(false);

  const craneBodyVisualMesh = useMemo(() => {
      if (!scene) {
        console.warn("GLTF scene not loaded yet for Crane. Skipping clone.");
        return null;
      }

      const clone = scene.clone(true); 

      const objectsToDetach = [];
      clone.traverse((obj) => {
        if (obj.name === 'movePlate' || obj.name === 'CraneInvisibleBulkSensor') {
          objectsToDetach.push(obj);
        }
      });
      objectsToDetach.forEach(obj => {
          if (obj.parent) {
              obj.parent.remove(obj);
          }
      });

      clone.position.set(0, 0, 0); 
      clone.rotation.set(0, 0, 0);
      clone.updateMatrixWorld(true); 
      return clone;
    }, [scene]); 

    // console.log(`[Crane.jsx] Crane ${id} is rendering. currentCranePosition from store:`, currentCranePosition.toArray());

  // ----------------- Crane 整體物理體 -----------------
  const [craneRef, craneApi] = useBox(() => ({
    mass: 0, 
    material: 'CraneMeshBody',
    type: 'Kinematic', 
    position: currentCranePosition.toArray(), // 初始位置從 store 獲取
    rotation: rotation, 
    args: [0.1, 0.1, 0.1], 
    userData: { id: `craneBody-${id}` }
  })); 

  useEffect(() => {
    // 這個 useEffect 僅用於首次掛載時，確保物理體位置與 store 初始值同步
    if (craneApi && currentCranePosition && !hasSetInitialPosition.current) {
      craneApi.position.set(currentCranePosition.x, currentCranePosition.y, currentCranePosition.z);
      hasSetInitialPosition.current = true; 
      // console.log(`[Crane.jsx useEffect] Setting initial physical position for ${id} to:`, currentCranePosition.toArray());
    }
  }, [craneApi, id, currentCranePosition]); 

  // ----------------- useFrame for Crane's movement -----------------
  useFrame((_, delta) => {
    if (!craneApi || !craneApi.position || !targetCranePosition) {
      return;
    }

    const shouldMove = !currentCranePosition.equals(targetCranePosition) && !isMoveTableMoving;
    if (!shouldMove) {
      return;
    }

    const distance = currentCranePosition.distanceTo(targetCranePosition);
    const moveStep = craneMoveSpeed * delta;
    const newPosition = moveStep >= distance
      ? targetCranePosition
      : currentCranePosition.clone().add(
        targetCranePosition.clone().sub(currentCranePosition).normalize().multiplyScalar(moveStep)
      );

    updateCraneCurrentPosition(id, newPosition.toArray());
    craneApi.position.set(newPosition.x, newPosition.y, newPosition.z);
  });


  return (
    <>
      <group ref={craneRef}> 
        {craneBodyVisualMesh && (
          <primitive 
              object={craneBodyVisualMesh} 
              position={[0,0,0]} 
              rotation={[0,0,0]}
          />
        )}
        {/* 可以考慮添加一個可視化的物理體來確認其位置是否正確 */}
        {/* <mesh>
            <boxGeometry args={[3, 5, 3]} /> 
            <meshBasicMaterial color="red" wireframe opacity={0.5} transparent />
        </mesh> */}
      </group>

       {/* 傳遞 Crane 的當前**物理世界位置**和旋轉給 MoveTable 和 Sensor 組件 */}
      <MoveTable
        id={id}
        craneWorldPosition={currentCranePosition.toArray()} 
        craneWorldRotation={rotation} 
        modelPath={modelPath} 
      />

      <CraneInvisibleBulkSensor
          id={id}
          craneWorldPosition={currentCranePosition.toArray()}
          craneWorldRotation={rotation}
          setCraneSensorDetected={setCraneSensorDetected}
        />
    </>  
  );
}
