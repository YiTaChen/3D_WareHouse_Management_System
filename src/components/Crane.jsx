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
  } = useCraneStore(state => state.getCraneState(id));

  const updateCraneCurrentPosition = useCraneStore(state => state.updateCraneCurrentPosition);
  const setCraneRef = useCraneStore(state => state.setCraneRef);

  const hasSetInitialPosition = useRef(false);
  const craneVisualRef = useRef(null);

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

  useEffect(() => {
    setCraneRef(id, { ref: craneVisualRef });
    return () => setCraneRef(id, null);
  }, [id, setCraneRef]);

  // ----------------- useFrame for Crane's movement -----------------
  useFrame((_, delta) => {
    const liveCraneState = useCraneStore.getState().getCraneState(id);
    if (!liveCraneState || !craneApi || !craneApi.position) {
      return;
    }

    const liveCurrentPosition = liveCraneState.currentCranePosition;
    const liveTargetPosition = liveCraneState.targetCranePosition;
    const shouldMove = !liveCurrentPosition.equals(liveTargetPosition)
      && !liveCraneState.isMoveTableMoving;

    if (!shouldMove) {
      craneVisualRef.current?.position.copy(liveCurrentPosition);
      return;
    }

    const distance = liveCurrentPosition.distanceTo(liveTargetPosition);
    const moveStep = liveCraneState.craneMoveSpeed * delta;
    const newPosition = moveStep >= distance
      ? liveTargetPosition
      : liveCurrentPosition.clone().add(
        liveTargetPosition.clone().sub(liveCurrentPosition).normalize().multiplyScalar(moveStep)
      );

    // Keep the visible model responsive even when the Cannon worker is busy.
    craneVisualRef.current?.position.copy(newPosition);
    updateCraneCurrentPosition(id, newPosition.toArray());
    craneApi.position.set(newPosition.x, newPosition.y, newPosition.z);
  }, -2);


  return (
    <>
      <group ref={craneRef} visible={false} />
      <group
        ref={craneVisualRef}
        position={currentCranePosition.toArray()}
        rotation={rotation}
      >
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

       {/* MoveTable reads live crane position from the store; the sensor still receives it explicitly. */}
      <MoveTable
        id={id}
        craneWorldRotation={rotation} 
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
