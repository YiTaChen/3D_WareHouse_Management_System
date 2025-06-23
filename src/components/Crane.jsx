import React, { useMemo, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useCraneStore } from '../stores/craneStore';
import { useFrame } from '@react-three/fiber';
import MoveTable from './MoveTable';
import CraneInvisibleBulkSensor from './CraneInvisibleBulkSensor';


// 輔助函數：獲取 Three.js 物件的本地尺寸 (用於創建碰撞體 args)
function getLocalBoundingBoxSize(mesh) {
    if (!mesh || !mesh.geometry) return [1, 1, 1];
    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    return size.toArray();
}

export default function Crane({ id, modelPath, position, rotation }) {
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

  // ----------------- useFrame for Crane's continuous movement -----------------
  useFrame((state, delta) => { // 重新引入 delta 參數以實現平滑移動
    if (!craneApi || !craneApi.position || !targetCranePosition) {
        return;
    }

    const currentPhysicsPosition = new THREE.Vector3();
    craneApi.position.copy(currentPhysicsPosition); 

    let newPosition; // 用來儲存最終應該設定給物理體的位置

    // 判斷是否需要移動
    const shouldMove = !currentCranePosition.equals(targetCranePosition) && !isMoveTableMoving;

    if (shouldMove) {
        // 執行移動邏輯
        const distance = currentCranePosition.distanceTo(targetCranePosition); // 使用 store 中的 currentCranePosition 來計算距離
        const moveStep = craneMoveSpeed * delta; 

        if (moveStep >= distance) {
            newPosition = targetCranePosition; 
        } else {
            const direction = targetCranePosition.clone().sub(currentCranePosition).normalize(); // 使用 store 中的 currentCranePosition
            newPosition = currentCranePosition.clone().add(direction.multiplyScalar(moveStep));
        }
        // 更新 store，同時也會更新 isCraneMoving 狀態
        updateCraneCurrentPosition(id, newPosition.toArray()); 

    } else {
        // 不移動時，物理體的位置應該精確地等於 store 中的 currentCranePosition
        // 這強制物理引擎將其保持在目標位置，防止回到原點
        newPosition = currentCranePosition; // 直接使用 store 中的值
        
        // 如果已經到達目標位置，確保 isCraneMoving 是 false
        const currentIsCraneMoving = useCraneStore.getState().getCraneState(id).isCraneMoving;
        if (currentIsCraneMoving) {
            // 這裡更新 store 只是為了將 isCraneMoving 設為 false，位置本身應該已經正確
            updateCraneCurrentPosition(id, newPosition.toArray()); 
        }
    }
    
    // 確保物理體的位置始終被設定為計算出的 newPosition
    // 這是防止 Kinematic 物體回到 [0,0,0] 的關鍵
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
          modelPath={modelPath} 
          setCraneSensorDetected={setCraneSensorDetected}
        />
    </>  
  );
}