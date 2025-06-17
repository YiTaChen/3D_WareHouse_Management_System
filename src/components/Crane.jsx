

import React, { useMemo, useEffect, useRef  } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useCraneStore } from '../stores/craneStore'; // 引入新的 Crane Store
import { useBoxStore } from '../stores/boxStore'; // 引入 Box Store
import { useFrame } from '@react-three/fiber'; // 引入 
import MoveTable from './MoveTable'; // 引入新的 MoveTable 組件
import CraneInvisibleBulkSensor from './CraneInvisibleBulkSensor'; // 引入新的 CraneInvisibleBulkSensor 組件


// 輔助函數：獲取 Three.js 物件的世界座標、旋轉和尺寸
// 這個函數與 ConveyorExtras 中的一樣，可以考慮提取到一個共用的 utils 文件中
function getWorldProperties(mesh) {
  if (!mesh) return null;

  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();

  mesh.updateWorldMatrix(true, false); // 確保世界矩陣是最新的
  mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

  const localSize = mesh.geometry && mesh.geometry.boundingBox ?
    new THREE.Vector3().subVectors(mesh.geometry.boundingBox.max, mesh.geometry.boundingBox.min) :
    new THREE.Vector3(1, 1, 1); // Fallback for meshes without boundingBox (e.g., empty groups)
  const finalSize = localSize.multiply(worldScale).toArray();

  const euler = new THREE.Euler().setFromQuaternion(worldQuaternion);
  const rotationArray = [euler.x, euler.y, euler.z];

  return {
    position: worldPosition.toArray(),
    rotation: rotationArray,
    args: finalSize,
  };
}

export default function Crane({ id, modelPath, position, rotation }) {
  const { scene } = useGLTF('/Crane_ver1.gltf'); // 載入貨架的 GLTF 模型
  // const { scene: gltfScene } = useGLTF('/Crane_ver1.gltf'); // 載入貨架的 GLTF 模型

  const setCraneSensorDetected = useCraneStore(state => state.setCraneSensorDetected);
  const getBoxData = useBoxStore(state => state.getBoxData);

  // 從 store 中獲取相關狀態和 action
  const {
    currentCranePosition,
    targetCranePosition,
    craneMoveSpeed,
    // currentMoveTableLocalOffset, // separate to MoveTable 
    // targetMoveTableLocalOffset,   // separate to MoveTable 
    // moveTableSpeed,             // separate to MoveTable 
    isMoveTableMoving, // 新增：判斷 moveTable 是否在移動

  } = useCraneStore(state => state.getCraneState(id));

  const updateCraneCurrentPosition = useCraneStore(state => state.updateCraneCurrentPosition);

  // const updateMoveTableCurrentLocalOffset = useCraneStore(state => state.updateMoveTableCurrentLocalOffset);
  // separate to MoveTable
  
  // console.log('Crane currentCranePosition:', currentCranePosition);


  const craneBodyScene = useMemo(() => {
      // 確保 scene 已經載入
      if (!scene) {
        console.warn("GLTF scene not loaded yet for Crane. Skipping clone.");
        return null;
      }

      const clone = scene.clone(true); // 深度克隆整個場景

      // 收集要移除的物件
      const objectsToDetach = [];
      clone.traverse((obj) => {
        // 如果這個物件是 movePlate 或 CraneInvisibleBulkSensor
        if (obj.name === 'movePlate' || obj.name === 'CraneInvisibleBulkSensor') {
          objectsToDetach.push(obj);
        }
      });

      // 在遍歷結束後，將這些物件從克隆場景中「分離」
      // 注意：這裡不是 obj.parent.remove(obj); 而是將它們從層級中移除但不刪除
      // 因為它們的 Mesh 還需要傳給獨立組件的 primitive
      // 實際操作中，obj.parent.remove(obj) 是正確的，因為你希望 clone 裡沒有它們
      objectsToDetach.forEach(obj => {
          if (obj.parent) {
              obj.parent.remove(obj); // 從 craneBodyScene 樹中移除
          }
      });

      clone.position.set(...position);
      clone.rotation.set(...rotation);
      clone.updateMatrixWorld(true);
      return clone;
    }, [scene, position, rotation]);



  // ----------------- Crane 整體物理體 -----------------
  // 整個 Crane 作為一個 Kinematic Box，以便我們可以控制其位置
  const [craneRef, craneApi] = useBox(() => ({
    mass: 0, // 無質量，不參與碰撞響應
    material: 'CraneMeshBody',
    type: 'Kinematic', // 可以通過 api.position.set() 移動
    position: currentCranePosition.toArray(),
    rotation: rotation, // Crane 的初始旋轉
    args: [0, 0, 0], // 需要根據你的實際 Crane 模型尺寸調整這個 args // change to [0, 0, 0] for only position reference
                     // 這是整個 Crane 的碰撞箱尺寸，可以用 Blender 測量
  }));


  // const debugMeshRef = useRef(); // for debug mesh

  // ----------------- useFrame for continuous movement -----------------
  useFrame((state, delta) => {
    // Crane 整體移動  , 只有當 moveTable 不在移動時，Crane 才能移動
    if (!isMoveTableMoving && !currentCranePosition.equals(targetCranePosition)) {
      const distance = currentCranePosition.distanceTo(targetCranePosition);
      const moveDistance = craneMoveSpeed * delta; // 每幀移動的距離

      if (moveDistance >= distance) {
        // 到達或超過目標位置
        craneApi.position.set(targetCranePosition.x, targetCranePosition.y, targetCranePosition.z);
        updateCraneCurrentPosition(id, targetCranePosition.toArray());
      } else {
        // 向目標移動
        const direction = targetCranePosition.clone().sub(currentCranePosition).normalize();
        const newPosition = currentCranePosition.clone().add(direction.multiplyScalar(moveDistance));
        craneApi.position.set(newPosition.x, newPosition.y, newPosition.z);
        updateCraneCurrentPosition(id, newPosition.toArray());
      
      }

    }

    // //  debug mesh with the physics body
    // if (debugMeshRef.current && craneRef.current) {
    //     // Get the current world position and quaternion of the physics body's mesh (craneRef.current)
    //     const physicsMeshPosition = new THREE.Vector3();
    //     const physicsMeshQuaternion = new THREE.Quaternion();
    //     craneRef.current.getWorldPosition(physicsMeshPosition);
    //     craneRef.current.getWorldQuaternion(physicsMeshQuaternion);

    //     // Apply these to the debug mesh
    //     debugMeshRef.current.position.copy(physicsMeshPosition);
    //     debugMeshRef.current.quaternion.copy(physicsMeshQuaternion);
    // }

  });


  return (
    <>
      {/* 渲染 Crane 的其餘部分 GLTF 模型 */}
        {/* Crane 的 GLTF 網格會自動作為 physics body 的子項渲染 */}
      <primitive object={craneBodyScene} 
                  ref={craneRef}
                  
                  >
      
      </primitive>


      {/* <mesh ref={debugMeshRef}>
        <boxGeometry args={[3, 1, 3]} />
        <meshBasicMaterial color="blue" wireframe opacity={0.3} transparent />
      </mesh> */}

   
       {/* 傳遞 Crane 的當前位置和旋轉給 MoveTable 組件 */}
      <MoveTable
        id={id}
        craneWorldPosition={currentCranePosition.toArray()} // 傳遞 Crane 的世界位置
        craneWorldRotation={rotation} // 傳遞 Crane 的世界旋轉
        modelPath={modelPath} // 傳遞 Crane 的模型路徑，讓 MoveTable 自己載入 moveTable 部分
      />

        {/* 傳遞 Crane 的當前位置和旋轉給 CraneInvisibleBulkSensor 組件 */}
        <CraneInvisibleBulkSensor
          id={id}
          craneWorldPosition={currentCranePosition.toArray()}
          craneWorldRotation={rotation}
          modelPath={modelPath} // Sensor 也從完整的模型中提取
        />


    </>  
  );
}



