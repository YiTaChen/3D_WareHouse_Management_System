// src/components/ConveyorExtras.jsx
import React, { useEffect, useRef, useMemo } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useConveyorStore } from '../stores/conveyorStore';
import { useBoxStore } from '../stores/boxStore'; // 引入 Box Store

export default function ConveyorExtras({
  id,
  conveyorPosition,
  conveyorRotation, // Conveyor自身的旋轉，用於轉換本地座標到世界座標
  invisibleMaterialMesh,
  sensor1Mesh,
  sensor2Mesh,
  lightBulbMesh,
}) {
  const setSensorDetected = useConveyorStore(state => state.setSensorDetected);
  const { lightColor } = useConveyorStore(state => state.getConveyorState(id));

  const getBoxData = useBoxStore(state => state.getBoxData); // 獲取 Box 資料的方法


  
//   console.log(`invisibleMaterialMesh for ID ${id}:`, invisibleMaterialMesh);
//   console.log(`ConveyorExtras for ID ${id} - lightColor:`, lightColor);
  
  // ----------------- 燈光控制 -----------------
  useEffect(() => {
    if (lightBulbMesh && lightBulbMesh.material) {
      // GLTF 材質可能是 MeshStandardMaterial 或其他類型
      if (lightBulbMesh.material.isMeshStandardMaterial) {
        lightBulbMesh.material.color.set(lightColor);
      } else if (lightBulbMesh.material.isMeshBasicMaterial) {
        // 如果是 MeshBasicMaterial，可能也直接設定顏色
        lightBulbMesh.material.color.set(lightColor);
      }
      // 如果 GLTF 載入的材質是 ArrayOfMaterials, 則可能需要遍歷
      // For simplicity, we assume it's a single material.
      // If the light bulb has multiple materials or sub-meshes that need to be lit,
      // you might need to traverse lightBulbMesh.children or handle an array of materials.
    }
  }, [lightColor, lightBulbMesh]); // 監聽 lightColor 和 lightBulbMesh 變化

  // ----------------- 讓 InvisibleMaterial 隱形 -----------------
  useEffect(() => {
    if (invisibleMaterialMesh && invisibleMaterialMesh.material) {
        // console.log("InvisibleMaterial's material before modification:", invisibleMaterialMesh.material);
      // 確保材質是透明的
      invisibleMaterialMesh.material.transparent = true;
      invisibleMaterialMesh.material.opacity = 0; // 完全透明
      invisibleMaterialMesh.material.needsUpdate = true; // 通知 Three.js 材質已更新
    //   console.log("InvisibleMaterial's material after modification:", invisibleMaterialMesh.material);
    }
  }, [invisibleMaterialMesh]); // 監聽 invisibleMaterialMesh 變化，確保它載入後才執行







  // 輔助函數：獲取 Three.js 物件的世界座標、旋轉和尺寸
  const getWorldProperties = (mesh) => {
    if (!mesh) return null;

    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();

    mesh.updateWorldMatrix(true, false); // 確保世界矩陣是最新的
    mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    // 注意：這裡的 size 已經是世界空間的尺寸，無需再乘以 scale
    // 但是，由於cannonjs的args是根據物體自身的local geometry來的，
    // 需要考慮mesh的local geometry尺寸和它在glTF場景中的scale
    // 最穩健的方法是使用 mesh.geometry.boundingBox 或 mesh.geometry.boundingSphere
    // 然後結合其在世界中的scale
    const localSize = mesh.geometry ? new THREE.Vector3().subVectors(mesh.geometry.boundingBox.max, mesh.geometry.boundingBox.min) : new THREE.Vector3(1,1,1);
    const finalSize = localSize.multiply(worldScale).toArray();

    // 將四元數轉換為 Euler 角度，供 useBox 的 rotation 屬性使用
    const euler = new THREE.Euler().setFromQuaternion(worldQuaternion);
    const rotationArray = [euler.x, euler.y, euler.z];

    return {
      position: worldPosition.toArray(),
      rotation: rotationArray,
      args: finalSize,
    };
  };

  // ----------------- 隱形碰撞體 (InvisibleMaterial) -----------------
  const invisibleMaterialProps = useMemo(() => getWorldProperties(invisibleMaterialMesh), [invisibleMaterialMesh]);
  const [invisibleRef] = useBox(() => ({
    mass: 0, // 靜止物體
    isTrigger: true, // 設置為觸發器，不會阻擋物體，只檢測碰撞
    position: invisibleMaterialProps?.position || [0, 0, 0],
    rotation: invisibleMaterialProps?.rotation || [0, 0, 0],
    args: invisibleMaterialProps?.args || [1, 1, 1],
    // material: 'invisible', // 可以定義一個新的碰撞材質
    type: 'Static', // 不會移動
    onCollideBegin: (e) => {
    //   console.log(`Conveyor ${id}: Box entered the invisible area!`, e.body.material.name, e.body.position, e.body );
    //   if (e.body.material.name === 'box') {
    //     // console.log(`Conveyor ${id}: Box entered the main detection area!`);
    //     // Maybe update a store state if the conveyor is "active" or "blocked"
    //     // setConveyorAreaOccupied(id, true); // Example
    //   }
        const boxId = e.body.userData?.appId;
        if (boxId) { // 確保是 Box 觸發的
            setSensorDetected(id, 'BulkSensorDetected', true);
            const boxData = getBoxData(boxId); // 從 store 獲取 Box 的資料
            console.log(`Conveyor ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) entered the main detection area!`);

          // 例如：if (boxData.content === 'Fragile Item') { /* special handling */ }
        }



    },
    onCollideEnd: (e) => {
    
        const boxId = e.body.userData?.appId;
        if (boxId) {
            setSensorDetected(id, 'BulkSensorDetected', false);
            const boxData = getBoxData(boxId);
            console.log(`Conveyor ${id}: Box ID ${boxId} (Name: ${boxData?.name}) left the main detection area!`);
        }
    },
  }));

  // ----------------- 感應器 (Sensor_1, Sensor_2) -----------------
  const sensor1Props = useMemo(() => getWorldProperties(sensor1Mesh), [sensor1Mesh]);
  const [sensor1Ref] = useBox(() => ({
    mass: 0,
    isTrigger: true, // 設置為觸發器，不會阻擋物體，只檢測碰撞
    position: sensor1Props?.position || [0, 0, 0],
    rotation: sensor1Props?.rotation || [0, 0, 0],
    args: sensor1Props?.args || [0.5, 0.5, 0.5], // 默認值，確保有尺寸
    onCollideBegin: (e) => {


        // change using bulk sensor first

    //   if (e.body.material.name === 'box') { // 假設 Box 的材質名稱為 'box'
    //     setSensorDetected(id, 'sensor1Detected', true);
    //     console.log(`Conveyor ${id}: Sensor 1 Detected Box!`);
    //   }
    },
    onCollideEnd: (e) => {
    //   if (e.body.material.name === 'box') {
    //     setSensorDetected(id, 'sensor1Detected', false);
    //     console.log(`Conveyor ${id}: Sensor 1 Lost Box!`);
    //   }
    },
  }));

  const sensor2Props = useMemo(() => getWorldProperties(sensor2Mesh), [sensor2Mesh]);
  const [sensor2Ref] = useBox(() => ({
    mass: 0,
    isTrigger: true,
    position: sensor2Props?.position || [0, 0, 0],
    rotation: sensor2Props?.rotation || [0, 0, 0],
    args: sensor2Props?.args || [0.5, 0.5, 0.5], // 默認值，確保有尺寸
    onCollideBegin: (e) => {


        // change using bulk sensor first 

    //   if (e.body.material.name === 'box') {
    //     setSensorDetected(id, 'sensor2Detected', true);
    //     console.log(`Conveyor ${id}: Sensor 2 Detected Box!`);
    //   }
    },
    onCollideEnd: (e) => {
    //   if (e.body.material.name === 'box') {
    //     setSensorDetected(id, 'sensor2Detected', false);
    //     console.log(`Conveyor ${id}: Sensor 2 Lost Box!`);
    //   }
    },
  }));


  return (
    <>
      {/* 物理碰撞體不需渲染可見的網格，它們會自動添加到物理世界 */}
      {/* 如果需要視覺調試，可以在這裡添加 mesh */}
      {/* Example for debugging: */}
      {/* {invisibleMaterialProps && (
        <mesh ref={invisibleRef}>
          <boxGeometry args={invisibleMaterialProps.args} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
      )}
      {sensor1Props && (
        <mesh ref={sensor1Ref}>
          <boxGeometry args={sensor1Props.args} />
          <meshBasicMaterial color="blue" wireframe />
        </mesh>
      )}
      {sensor2Props && (
        <mesh ref={sensor2Ref}>
          <boxGeometry args={sensor2Props.args} />
          <meshBasicMaterial color="green" wireframe />
        </mesh>
      )} */}
    </>
  );
}