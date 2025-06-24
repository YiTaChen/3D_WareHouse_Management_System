import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useCraneStore } from '../stores/craneStore';
import { useBoxStore } from '../stores/boxStore';
import { useFrame } from '@react-three/fiber';
import { useBoxEquipStore } from '../stores/boxEquipStore';




// 輔助函數：獲取 Three.js 物件的本地尺寸 (通常用於創建碰撞體 args)
function getLocalBoundingBoxSize(mesh) {
  if (!mesh || !mesh.geometry) return [1, 1, 1]; // 默認值

  const bbox = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  return size.toArray();
}



export default function CraneInvisibleBulkSensor({ id, modelPath, craneWorldPosition, craneWorldRotation }) {
  
  
  // const { scene } = useGLTF('/Crane_ver1.gltf'); // 載入完整的 Crane 模型來提取感測器部分
  const { scene: fullCraneScene } = useGLTF('/Crane_ver1.gltf');

  const setCraneSensorDetected = useCraneStore(state => state.setCraneSensorDetected);
  const getBoxData = useBoxStore(state => state.getBoxData);

  // // 提取感測器網格
  // const bulkSensorMesh = useMemo(() => {
  //   let mesh = null;
  //   scene.traverse((obj) => {
  //     if (obj.isMesh && obj.name === 'CraneInvisibleBulkSensor') {
  //       mesh = obj.clone(); // 克隆網格以確保獨立性
  //       // 將 Blender 中的感測器網格隱形
  //       if (mesh.material) {
  //         mesh.material.transparent = true;
  //         mesh.material.opacity = 0;
  //         mesh.material.needsUpdate = true;
  //       }
  //       mesh.traverse((child) => { // 如果感測器是個組，遍歷其子網格
  //           if (child.isMesh && child.material) {
  //               child.material = child.material.clone();
  //               child.material.transparent = true;
  //               child.material.opacity = 0;
  //               child.material.needsUpdate = true;
  //           }
  //       });
  //     }
  //   });
  //   return mesh;
  // }, [scene]);

  const bulkSensorMesh = useMemo(() => {
    let mesh = null;
    fullCraneScene.traverse((obj) => {
      if (obj.isMesh && obj.name === 'CraneInvisibleBulkSensor') {
        mesh = obj.clone(); // 克隆感測器
        // ... 設置透明材質 ...
      }
    });
    return mesh;
  }, [fullCraneScene]); // 依賴 fullCraneScene

  // 獲取感測器在 Blender 中的本地位置和尺寸
  const bulkSensorLocalProps = useMemo(() => {
    if (bulkSensorMesh) {
      return {
        position: bulkSensorMesh.position.toArray(), // 獲取本地位置
        rotation: bulkSensorMesh.rotation.toArray(), // 獲取本地旋轉
        args: getLocalBoundingBoxSize(bulkSensorMesh), // 獲取本地尺寸
      };
    }
    return { position: [0, 0, 0], rotation: [0, 0, 0], args: [1, 1, 1] };
  }, [bulkSensorMesh]);

  const setBoxCollidingWithEquipment = useBoxEquipStore(state => state.setBoxCollidingWithEquipment);
  const clearBoxCollision = useBoxEquipStore(state => state.clearBoxCollision); // 使用判斷，確保函數存在


  // ----------------- 隱形感測器物理體 -----------------
  const [bulkSensorRef, bulkSensorApi] = useBox(() => ({
    mass: 0,
    isTrigger: true,
    type: 'Kinematic', // 設置為 Kinematic，以便我們在 useFrame 中控制它跟隨 Crane
    position: new THREE.Vector3(...craneWorldPosition) // 初始位置基於 Crane
                 .add(new THREE.Vector3(...bulkSensorLocalProps.position).applyEuler(new THREE.Euler(...craneWorldRotation)))
                 .toArray(),
    rotation: craneWorldRotation, // 初始旋轉與 Crane 相同
    args: bulkSensorLocalProps.args,
    onCollideBegin: (e) => {
      const boxId = e.body.userData?.appId;
      if (boxId) {
        setCraneSensorDetected(id, 'BulkSensorDetected', true);
        const boxData = getBoxData(boxId);

        clearBoxCollision(boxId); // clear last one 
        setBoxCollidingWithEquipment(boxId, id); // add current one

        // console.log(`Crane ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) entered Crane Bulk Sensor.`);
      }
    },
    onCollideEnd: (e) => {
      const boxId = e.body.userData?.appId;
      if (boxId) {
        setCraneSensorDetected(id, 'BulkSensorDetected', false);
        const boxData = getBoxData(boxId);
        // console.log(`Crane ${id}: Box ID ${boxId} (Name: ${boxData?.name}) Content: ${boxData?.content}) left Crane Bulk Sensor.`);
      }
    },
  }));

  // ----------------- useFrame for sensor movement -----------------
  useFrame(() => {
    // 獲取 Crane 物理體的當前世界位置和旋轉 (從 props 傳入的 Crane 世界位置和旋轉)
    const cranePhysicsWorldPosition = new THREE.Vector3(...craneWorldPosition);
    const cranePhysicsWorldQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...craneWorldRotation));

    // 計算 bulkSensor 的世界目標位置：Crane 的世界位置 + bulkSensor 的本地偏移（經過 Crane 旋轉）
    const bulkSensorOffsetFromCrane = new THREE.Vector3(...bulkSensorLocalProps.position);
    bulkSensorOffsetFromCrane.applyQuaternion(cranePhysicsWorldQuaternion);
    const bulkSensorTargetWorldPosition = cranePhysicsWorldPosition.clone().add(bulkSensorOffsetFromCrane);

    // 設置 bulkSensor 物理體的位置和旋轉
    bulkSensorApi.position.set(bulkSensorTargetWorldPosition.x, bulkSensorTargetWorldPosition.y, bulkSensorTargetWorldPosition.z);
    bulkSensorApi.quaternion.set(cranePhysicsWorldQuaternion.x, cranePhysicsWorldQuaternion.y, cranePhysicsWorldQuaternion.z, cranePhysicsWorldQuaternion.w);
  });

  return (
    <>
      {/* 為了調試，渲染 Bulk Sensor 的物理碰撞箱 */}
      {bulkSensorLocalProps && (
        <mesh ref={bulkSensorRef}>
          {/* <boxGeometry args={bulkSensorLocalProps.args} />
          <meshBasicMaterial color="red" wireframe opacity={0.5} transparent /> */}
        </mesh>
      )}
    </>
  );
}