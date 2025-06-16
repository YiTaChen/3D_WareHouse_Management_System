

import React, { useMemo, useEffect } from 'react';
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



  // 克隆場景並移除 moveTable 網格
  const craneBodyScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if (obj.name === 'moveTable' && obj.parent) {
        obj.parent.remove(obj); // 移除 moveTable
      }
      // 不再移除 CraneInvisibleBulkSensor，因為它會被獨立處理
    });
    clone.position.set(...position);
    clone.rotation.set(...rotation);
    clone.updateMatrixWorld(true);
    return clone;
  }, [scene, position, rotation]);



  // // 提取需要互動的網格物件
  // const cranePhysicalParts = useMemo(() => {
  //   const parts = {};
  //   // 遍歷原始模型，找到 sensor。注意：moveTable 已經從 clonedScene 中移除了
  //   scene.traverse((obj) => { // 遍歷原始 scene 來獲取未被移除的部件
  //     if (obj.isMesh) {
  //       if (obj.name === 'CraneInvisibleBulkSensor') {
  //         parts.bulkSensor = obj;
  //       }
  //     }
  //   });
  //   return parts;
  // }, [scene]);

  // ** Separate the CraneInvisibleBulkSensor logic to a new component **
  // const { clonedScene, bulkSensorMesh } = craneBodyScene;

  // // 讓 CraneInvisibleBulkSensor 隱形 (直接對 bulkSensorMesh 操作)
  // useEffect(() => {
  //   if (bulkSensorMesh && bulkSensorMesh.material) {
  //     bulkSensorMesh.material.transparent = true;
  //     bulkSensorMesh.material.opacity = 0;
  //     bulkSensorMesh.material.needsUpdate = true;
  //   }
  // }, [bulkSensorMesh]);


  // // 讓 CraneInvisibleBulkSensor 隱形
  // useEffect(() => {
  //   if (cranePhysicalParts.bulkSensor && cranePhysicalParts.bulkSensor.material) {
  //       cranePhysicalParts.bulkSensor.material.transparent = true;
  //       cranePhysicalParts.bulkSensor.material.opacity = 0;
  //       cranePhysicalParts.bulkSensor.material.needsUpdate = true;
  //   }
  // }, [cranePhysicalParts.bulkSensor]);

  // ----------------- Crane 整體物理體 -----------------
  // 整個 Crane 作為一個 Kinematic Box，以便我們可以控制其位置
  const [craneRef, craneApi] = useBox(() => ({
    mass: 0, // 無質量，不參與碰撞響應
    material: 'CraneMeshBody',
    type: 'Kinematic', // 可以通過 api.position.set() 移動
    position: currentCranePosition.toArray(),
    rotation: rotation, // Crane 的初始旋轉
    args: [3, 5, 3], // 需要根據你的實際 Crane 模型尺寸調整這個 args
                     // 這是整個 Crane 的碰撞箱尺寸，可以用 Blender 測量
  }));


  // *** move to MoveTable.jsx ***
  // // ----------------- moveTable 物理體 -----------------
  // // moveTable 作為一個獨立的 Kinematic Box
  // const moveTableDefaultProps = useMemo(() => {
  //     // 獲取 isolatedMoveTableMesh 的世界屬性，如果它在原始模型中存在
  //     // 注意：這裡假設 isolatedMoveTableMesh 是在原始模型中相對應的，
  //     // 如果您的 moveTable 網格在 GLTF 中有特定的本地轉換，這裡可能需要調整。
  //     // 最保險的是直接從 isolatedMoveTableMesh 本身獲取其本地尺寸
  //     if (isolatedMoveTableMesh && isolatedMoveTableMesh.geometry) {
  //         const bbox = new THREE.Box3().setFromObject(isolatedMoveTableMesh);
  //         const size = new THREE.Vector3();
  //         bbox.getSize(size);
  //         return { args: size.toArray() };
  //     }
  //     return { args: [1, 0.2, 1] }; // 預設值
  // }, [isolatedMoveTableMesh]);

  // const [moveTableRef, moveTableApi] = useBox(() => ({
  //   mass: 0,
  //   type: 'Kinematic',
  //   position: currentCranePosition.clone().add(currentMoveTableLocalOffset).toArray(), // 初始位置是 Crane 位置 + 本地偏移
  //   rotation: rotation, // moveTable 和 Crane 保持相同的旋轉
  //   args: moveTableDefaultProps.args,
  //   material: 'craneTable', // 用於與 Box 互動的材質
  // }));


  // ----------------- 隱形感測器 (CraneInvisibleBulkSensor) -----------------
  // const bulkSensorProps = useMemo(() => getWorldProperties(cranePhysicalParts.bulkSensor), [cranePhysicalParts.bulkSensor]);
  // //   console.log('Crane cranePhysicalParts:', cranePhysicalParts);
  // // // 提取感測器的世界屬性
  // //   console.log('Crane bulkSensorProps:', bulkSensorProps);

  // const initialCraneWorldPosition = new THREE.Vector3(...position); // Crane 的初始世界位置
  // const bulkSensorLocalPosition = new THREE.Vector3(...(bulkSensorProps?.position || [0,0,0])); // 感測器在原始模型中的本地位置

  // // 如果感測器在 Blender 中是相對於 Crane 根部的，你需要將其與 Crane 的初始世界位置結合
  // // 假設 bulkSensorLocalPosition 已經是相對於 GLTF 模型原點的
  // const adjustedBulkSensorPosition = initialCraneWorldPosition.add(bulkSensorLocalPosition).toArray();


  // change
  // const [bulkSensorRef] = useBox(() => ({
  //   mass: 0,
  //   isTrigger: true,
  //   type: 'Static', // 感測器通常是靜態的
  //   position: adjustedBulkSensorPosition?.position || [0, 0, 0],
  //   rotation: bulkSensorProps?.rotation || [0, 0, 0],
  //   args: bulkSensorProps?.args || [1, 1, 1],
  //   onCollideBegin: (e) => {
  //     const boxId = e.body.userData?.appId;
  //     if (boxId) {
  //       setCraneSensorDetected(id, 'BulkSensorDetected', true);
  //       const boxData = getBoxData(boxId);
  //       console.log(`Crane ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) entered Crane Bulk Sensor.`);
  //     }
  //   },
  //   onCollideEnd: (e) => {
  //     const boxId = e.body.userData?.appId;
  //     if (boxId) {
  //       setCraneSensorDetected(id, 'BulkSensorDetected', false);
  //       const boxData = getBoxData(boxId);
  //       console.log(`Crane ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) left Crane Bulk Sensor.`);
  //     }
  //   },
  // }));


  // separate to CraneInvisibleBulkSensor.jsx
  // // ----------------- 隱形感測器 (CraneInvisibleBulkSensor) -----------------
  // // 獲取感測器相對於其父級的本地尺寸和位置
  // const bulkSensorLocalProps = useMemo(() => {
  //   if (bulkSensorMesh && bulkSensorMesh.geometry) {
  //       // 感測器在 Blender 中的本地位置和尺寸
  //       const bbox = new THREE.Box3().setFromObject(bulkSensorMesh); // 使用原始 mesh 獲取其本地邊界框
  //       const size = new THREE.Vector3();
  //       bbox.getSize(size);
  //       const position = bulkSensorMesh.position.toArray(); // 使用 mesh 的本地位置

  //       return {
  //           position: position,
  //           rotation: bulkSensorMesh.rotation.toArray(),
  //           args: size.toArray(),
  //       };
  //   }
  //   return { position: [0, 0, 0], rotation: [0, 0, 0], args: [1, 1, 1] };
  // }, [bulkSensorMesh]);

  // // 新增一個 ref 給 bulkSensor 的物理體
  // const [bulkSensorRef, bulkSensorApi] = useBox(() => ({
  //   mass: 0,
  //   isTrigger: true,
  //   type: 'Kinematic', // 設置為 Kinematic，以便我們在 useFrame 中控制它跟隨 Crane
  //   position: currentCranePosition.toArray(), // 初始位置隨 Crane 設置
  //   rotation: rotation,
  //   args: bulkSensorLocalProps.args,
  //   onCollideBegin: (e) => {
  //     const boxId = e.body.userData?.appId;
  //     if (boxId) {
  //       setCraneSensorDetected(id, 'BulkSensorDetected', true);
  //       const boxData = getBoxData(boxId);
  //       console.log(`Crane ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) entered Crane Bulk Sensor.`);
  //     }
  //   },
  //   onCollideEnd: (e) => {
  //     const boxId = e.body.userData?.appId;
  //     if (boxId) {
  //       setCraneSensorDetected(id, 'BulkSensorDetected', false);
  //       const boxData = getBoxData(boxId);
  //       console.log(`Crane ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) left Crane Bulk Sensor.`);
  //     }
  //   },
  // }));





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


    // // 更新 bulkSensor 的位置，使其跟隨 Crane 的物理體
    // // 獲取 Crane 物理體的當前世界位置和旋轉
    // const cranePhysicsWorldPosition = new THREE.Vector3();
    // const cranePhysicsWorldQuaternion = new THREE.Quaternion();
    // craneApi.position.copy(cranePhysicsWorldPosition); // 直接從 api 獲取當前物理體位置
    // craneApi.quaternion.copy(cranePhysicsWorldQuaternion); // 直接從 api 獲取當前物理體旋轉

    // // 計算 bulkSensor 的世界目標位置：Crane 的世界位置 + bulkSensor 的本地偏移（經過 Crane 旋轉）
    // const bulkSensorOffsetFromCrane = new THREE.Vector3(...bulkSensorLocalProps.position);
    
    // console.log('bulkSensorLocalProps:', bulkSensorLocalProps);
    
    // bulkSensorOffsetFromCrane.applyQuaternion(cranePhysicsWorldQuaternion);
    // const bulkSensorTargetWorldPosition = cranePhysicsWorldPosition.clone().add(bulkSensorOffsetFromCrane);

    // // 設置 bulkSensor 物理體的位置和旋轉
    // bulkSensorApi.position.set(bulkSensorTargetWorldPosition.x, bulkSensorTargetWorldPosition.y, bulkSensorTargetWorldPosition.z);
    // bulkSensorApi.quaternion.set(cranePhysicsWorldQuaternion.x, cranePhysicsWorldQuaternion.y, cranePhysicsWorldQuaternion.z, cranePhysicsWorldQuaternion.w);

    // too complicated, so separate parts into MoveTable.jsx, and make the function simple

    // // moveTable 相對移動 (世界座標計算)
    // // 這裡我們需要將 localOffset 轉換為世界座標。
    // // Crane 的世界位置是 craneRef 的位置，Crane 的旋轉是初始旋轉
    // const craneWorldPosition = new THREE.Vector3();
    // const craneWorldQuaternion = new THREE.Quaternion();
    // craneRef.current.getWorldPosition(craneWorldPosition);
    // craneRef.current.getWorldQuaternion(craneWorldQuaternion); // 獲取 Crane 的世界旋轉

    // const targetMoveTableWorldPosition = craneWorldPosition.clone();
    // const rotatedTargetOffset = targetMoveTableLocalOffset.clone().applyQuaternion(craneWorldQuaternion);
    // targetMoveTableWorldPosition.add(rotatedTargetOffset);

    // // 當前 moveTable 的世界位置
    // const currentMoveTableWorldPosition = new THREE.Vector3();
    // moveTableRef.current.getWorldPosition(currentMoveTableWorldPosition);


    // if (!currentMoveTableLocalOffset.equals(targetMoveTableLocalOffset)) {
    //   const distance = currentMoveTableWorldPosition.distanceTo(targetMoveTableWorldPosition);
    //   const moveDistance = moveTableSpeed * delta;

    //   if (moveDistance >= distance) {
    //     moveTableApi.position.set(targetMoveTableWorldPosition.x, targetMoveTableWorldPosition.y, targetMoveTableWorldPosition.z);
    //     updateMoveTableCurrentLocalOffset(id, targetMoveTableLocalOffset.toArray()); // 更新本地偏移
    //   } else {
    //     const direction = targetMoveTableWorldPosition.clone().sub(currentMoveTableWorldPosition).normalize();
    //     const newWorldPosition = currentMoveTableWorldPosition.clone().add(direction.multiplyScalar(moveDistance));
    //     moveTableApi.position.set(newWorldPosition.x, newWorldPosition.y, newWorldPosition.z);

    //     // 反向計算新的本地偏移，用於更新 store 狀態
    //     const newLocalOffset = newWorldPosition.clone().sub(craneWorldPosition).applyQuaternion(craneWorldQuaternion.clone().invert());
    //     updateMoveTableCurrentLocalOffset(id, newLocalOffset.toArray());
    //   }
    // }


  });


  return (
    <>
      {/* 渲染 Crane 的其餘部分 GLTF 模型 */}
        {/* Crane 的 GLTF 網格會自動作為 physics body 的子項渲染 */}
      <primitive object={craneBodyScene} ref={craneRef}>
      
      </primitive>

      {/*  separate to MoveTable.jsx   */ }
      {/* 單獨渲染 moveTable 的網格，作為其物理體的子項 */}
      {/* {isolatedMoveTableMesh && (
        <primitive object={isolatedMoveTableMesh} ref={moveTableRef} />
      )} */}

      {/* 如果需要視覺調試物理碰撞體，可以取消註釋以下代碼
      {/* 僅用於調試，實際應用中應隱藏 */}
      {/*  {/* {bulkSensorLocalProps && (
         <mesh ref={bulkSensorRef}>
           <boxGeometry args={bulkSensorProps.args} /> 
           <boxGeometry args={bulkSensorLocalProps.args} />
           
           <meshBasicMaterial color="red" wireframe opacity={0.5} transparent />
         </mesh>
       )} 
        */}

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



//   // 克隆場景以避免直接修改 GLTF 載入的原始場景
//   const clonedScene = useMemo(() => {
//     const clone = scene.clone(true);
//     clone.position.set(...position);
//     clone.rotation.set(...rotation);
//     clone.updateMatrixWorld(true); // 確保世界矩陣是正確的
//     return clone;
//   }, [scene, position, rotation]);

//   // 提取需要互動的網格物件
//   const craneParts = useMemo(() => {
//     const parts = {};
//     clonedScene.traverse((obj) => {
//         console.log('Crane obj.name:', obj.name, 'obj.isMesh:', obj.isMesh);
//       if (obj.isMesh) {
//         if (obj.name === 'movePlate') { // 假設你的桌面網格名稱為 'table'
//           parts.table = obj;
//         } else if (obj.name === 'CraneInvisibleBulkSensor') { // 假設你的感測器網格名稱為 'CraneInvisibleBulkSensor'
//           parts.bulkSensor = obj;
//         }
//       }
//     });
//     return parts;
//   }, [clonedScene]);


//   // 讓 CraneInvisibleBulkSensor 隱形
//   useEffect(() => {
//     if (craneParts.bulkSensor && craneParts.bulkSensor.material) {
//       craneParts.bulkSensor.material.transparent = true;
//       craneParts.bulkSensor.material.opacity = 0;
//       craneParts.bulkSensor.material.needsUpdate = true;
//     }
//   }, [craneParts.bulkSensor]);


//   // ----------------- 物理平面 (table) -----------------
//   const tableProps = useMemo(() => getWorldProperties(craneParts.table), [craneParts.table]);
//   const [tableRef] = useBox(() => ({
//     mass: 0, // 靜止物體
//     type: 'Static',
//     position: tableProps?.position || [0, 0, 0],
//     rotation: tableProps?.rotation || [0, 0, 0],
//     args: tableProps?.args || [1, 0.1, 1], // 默認值，確保有尺寸
//     material: 'craneTable', // 定義一個新的接觸材質
//   }));

//   // ----------------- 隱形感測器 (CraneInvisibleBulkSensor) -----------------
//   const bulkSensorProps = useMemo(() => getWorldProperties(craneParts.bulkSensor), [craneParts.bulkSensor]);
//   const [bulkSensorRef] = useBox(() => ({
//     mass: 0,
//     isTrigger: true, // 設置為觸發器，不會阻擋物體，只檢測碰撞
//     type: 'Static',
//     position: bulkSensorProps?.position || [0, 0, 0],
//     rotation: bulkSensorProps?.rotation || [0, 0, 0],
//     args: bulkSensorProps?.args || [1, 1, 1], // 默認值，確保有尺寸
//     // material: 'craneSensor', // 可以為感測器定義材質，如果需要
//     onCollideBegin: (e) => {
//       const boxId = e.body.userData?.appId; // 假設 Box 在創建時設定了 userData.appId
//       if (boxId) {
//         setCraneSensorDetected(id, 'BulkSensorDetected', true);
//         const boxData = getBoxData(boxId);
//         console.log(`Crane ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) entered Crane Bulk Sensor.`);
//       }
//     },
//     onCollideEnd: (e) => {
//       const boxId = e.body.userData?.appId;
//       if (boxId) {
//         setCraneSensorDetected(id, 'BulkSensorDetected', false);
//         const boxData = getBoxData(boxId);
//         console.log(`Crane ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) left Crane Bulk Sensor.`);
//       }
//     },
//   }));

//   return (
//     <>
//       {/* 渲染 GLTF 模型 */}
//       <primitive object={clonedScene} />

//       {/* 如果需要視覺調試物理碰撞體，可以取消註釋以下代碼 */}
//       {tableProps && (
//         <mesh ref={tableRef}>
//           <boxGeometry args={tableProps.args} />
//           <meshBasicMaterial color="#FFFFCC" wireframe opacity={0.5} transparent />
//         </mesh>
//       )}
//       {/* {bulkSensorProps && (
//         <mesh ref={bulkSensorRef}>
//           <boxGeometry args={bulkSensorProps.args} />
//           <meshBasicMaterial color="green" wireframe opacity={0.5} transparent />
//         </mesh>
//       )} */}
//     </>
//   );
// }




