import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useShelfStore } from '../stores/shelfStore'; // 引入新的 Shelf Store
import { useBoxStore } from '../stores/boxStore'; // 引入 Box Store
import { useBoxEquipStore } from '../stores/boxEquipStore';

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

export default function Shelf({ id, modelPath, position, rotation }) {
  const { scene } = useGLTF('/Shelf_ver1.gltf'); // 載入貨架的 GLTF 模型

  const setShelfSensorDetected = useShelfStore(state => state.setShelfSensorDetected);
  const getBoxData = useBoxStore(state => state.getBoxData);

  // 克隆場景以避免直接修改 GLTF 載入的原始場景
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.position.set(...position);
    clone.rotation.set(...rotation);
    clone.updateMatrixWorld(true); // 確保世界矩陣是正確的
    return clone;
  }, [scene, position, rotation]);

  // 提取需要互動的網格物件
  const shelfParts = useMemo(() => {
    const parts = {};
    clonedScene.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.name === 'table') { // 假設你的桌面網格名稱為 'table'
          parts.table = obj;
        } else if (obj.name === 'ShelfInvisibleBulkSensor') { // 假設你的感測器網格名稱為 'ShelfInvisibleBulkSensor'
          parts.bulkSensor = obj;
        }
      }
    });
    return parts;
  }, [clonedScene]);


  // 讓 ShelfInvisibleBulkSensor 隱形
  useEffect(() => {
    if (shelfParts.bulkSensor && shelfParts.bulkSensor.material) {
      shelfParts.bulkSensor.material.transparent = true;
      shelfParts.bulkSensor.material.opacity = 0;
      shelfParts.bulkSensor.material.needsUpdate = true;
    }
  }, [shelfParts.bulkSensor]);


  // ----------------- 物理平面 (table) -----------------
  const tableProps = useMemo(() => getWorldProperties(shelfParts.table), [shelfParts.table]);
  const [tableRef] = useBox(() => ({
    mass: 0, // 靜止物體
    type: 'Static',
    position: tableProps?.position || [0, 0, 0],
    rotation: tableProps?.rotation || [0, 0, 0],
    args: tableProps?.args || [1, 0.1, 1], // 默認值，確保有尺寸
    material: 'shelfTable', // 定義一個新的接觸材質
  }));



  const setBoxCollidingWithEquipment = useBoxEquipStore(state => state.setBoxCollidingWithEquipment);
  const clearBoxCollision = useBoxEquipStore(state => state.clearBoxCollision);
  

  // ----------------- 隱形感測器 (ShelfInvisibleBulkSensor) -----------------
  const bulkSensorProps = useMemo(() => getWorldProperties(shelfParts.bulkSensor), [shelfParts.bulkSensor]);
  const [bulkSensorRef] = useBox(() => ({
    mass: 0,
    isTrigger: true, // 設置為觸發器，不會阻擋物體，只檢測碰撞
    type: 'Static',
    position: bulkSensorProps?.position || [0, 0, 0],
    rotation: bulkSensorProps?.rotation || [0, 0, 0],
    args: bulkSensorProps?.args || [1, 1, 1], // 默認值，確保有尺寸
    // material: 'shelfSensor', // 可以為感測器定義材質，如果需要
    onCollideBegin: (e) => {
      const boxId = e.body.userData?.appId; // 假設 Box 在創建時設定了 userData.appId
      if (boxId) {
        setShelfSensorDetected(id, 'BulkSensorDetected', true);

        clearBoxCollision(boxId); // clear last one 
        setBoxCollidingWithEquipment(boxId, id); // add current one
            

        const boxData = getBoxData(boxId);
        // console.log(`Shelf ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) entered Shelf Bulk Sensor.`);
      }
    },
    onCollideEnd: (e) => {
      const boxId = e.body.userData?.appId;
      if (boxId) {
        setShelfSensorDetected(id, 'BulkSensorDetected', false);
        const boxData = getBoxData(boxId);
        // console.log(`Shelf ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) left Shelf Bulk Sensor.`);
      }
    },
  }));

  return (
    <>
      {/* 渲染 GLTF 模型 */}
      <primitive object={clonedScene} />

      {/* 如果需要視覺調試物理碰撞體，可以取消註釋以下代碼 */}
      {/* {tableProps && (
        <mesh ref={tableRef}>
          <boxGeometry args={tableProps.args} />
          <meshBasicMaterial color="blue" wireframe opacity={0.5} transparent />
        </mesh>
      )}
      {bulkSensorProps && (
        <mesh ref={bulkSensorRef}>
          <boxGeometry args={bulkSensorProps.args} />
          <meshBasicMaterial color="green" wireframe opacity={0.5} transparent />
        </mesh>
      )} */}
    </>
  );
}




