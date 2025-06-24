// components/ShelveMultiInstances.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useGLTF, Instances, Instance } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useShelfStore } from '../stores/shelfStore';
import { useBoxStore } from '../stores/boxStore';
import { useBoxEquipStore } from '../stores/boxEquipStore';
import { ShelfData } from '../data/ShelfData'; // 假設你的貨架數據在這裡

// 輔助函數：獲取 Three.js 物件的本地尺寸 (僅用於模型提取)
function getLocalBoundingBoxSize(mesh) {
  if (!mesh || !mesh.geometry) return [1, 1, 1];
  const bbox = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  return size.toArray();
}

export default function ShelveMultiInstances() {
  // 1. 單次載入 GLTF 模型，並提取原始幾何體和材質
  const { scene } = useGLTF('/Shelf_ver1.gltf');

  const shelfModelParts = useMemo(() => {
    const parts = {
      tableGeometry: null,
      tableMaterial: null,
      legGeometry: null,
      legMaterial: null,
      bulkSensorGeometry: null,
      bulkSensorMaterial: null,
    };

    // 這裡我們直接遍歷原始場景，不需要克隆
    scene.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.name === 'table') {
          parts.tableGeometry = obj.geometry;
          parts.tableMaterial = obj.material.clone(); // 克隆材質以允許獨立修改
          parts.tableMaterial.transparent = true;
          parts.tableMaterial.opacity = 0.7;
          parts.tableMaterial.needsUpdate = true;
        } else if (obj.name === 'ShelfInvisibleBulkSensor') {
          parts.bulkSensorGeometry = obj.geometry;
          parts.bulkSensorMaterial = obj.material.clone();
          parts.bulkSensorMaterial.transparent = true;
          parts.bulkSensorMaterial.opacity = 0; // 隱形
          parts.bulkSensorMaterial.needsUpdate = true;
        } else if (obj.name.startsWith('Leg_')) {
          // 假設所有腿的幾何體和材質都相同，只提取一個即可
          if (!parts.legGeometry) {
            parts.legGeometry = obj.geometry;
            parts.legMaterial = obj.material.clone();
            parts.legMaterial.transparent = true;
            parts.legMaterial.opacity = 0.7; // 設定腿部透明度
            parts.legMaterial.needsUpdate = true;
          }
        }
      }
    });
    return parts;
  }, [scene]); // 依賴原始 scene

  const { tableGeometry, tableMaterial, legGeometry, legMaterial, bulkSensorGeometry, bulkSensorMaterial } = shelfModelParts;

  // 2. 為每個貨架創建物理體（目前 ShelfInvisibleBulkSensor 仍為獨立實例）
  //    注意：這裡我們迭代 ShelfData.shelves 來為每個貨架創建其物理碰撞體
  const shelfPhysicsBodies = ShelfData.shelves.map((shelf) => {
    // 因為 GLTF 模型的子物件的本地位置、旋轉、尺寸是固定的
    // 我們需要計算它們相對於父級 Shelf 實例的世界屬性

    // 這裡需要手動計算每個 Shelf 的 table 和 sensor 在世界坐標中的位置和大小
    // 這是一個簡化的例子，實際應用中可能需要更精確的計算
    // 如果 Shelf_ver1.gltf 中的 table 和 sensor 都是在 (0,0,0) 為中心的相對位置
    // 那麼他們的物理位置將是 shelf.position 加上各自的本地偏移
    // 這裡為了簡化，我假設 table 和 sensor 的本地位置就是它們在 Shelf 模型中的相對位置

    // 你可能需要從模型中獲取這些本地偏移，或者從 Blender 獲取
    // 假設 table 在 Shelf 模型中的本地位置是 [0, -0.5, 0] (舉例)
    // 假設 sensor 在 Shelf 模型中的本地位置是 [0, 0, 0] (舉例)

    const tableLocalOffset = new THREE.Vector3(0, -0.5, 0); // <-- 這裡需要根據你的 GLTF 模型實際調整
    const sensorLocalOffset = new THREE.Vector3(0, 0, 0); // <-- 這裡需要根據你的 GLTF 模型實際調整

    const tableWorldPosition = new THREE.Vector3(...shelf.position).add(tableLocalOffset).toArray();
    const sensorWorldPosition = new THREE.Vector3(...shelf.position).add(sensorLocalOffset).toArray();

    // 假設 table 的尺寸是 2x0.1x1，感測器是 1x1x1
    const tableArgs = tableGeometry ? getLocalBoundingBoxSize(new THREE.Mesh(tableGeometry)) : [2, 0.1, 1];
    const sensorArgs = bulkSensorGeometry ? getLocalBoundingBoxSize(new THREE.Mesh(bulkSensorGeometry)) : [1, 1, 1];

    // 每個貨架的 table 物理體
    const [tableRef] = useBox(() => ({
      mass: 0,
      type: 'Static',
      position: tableWorldPosition,
      rotation: shelf.rotation,
      args: tableArgs,
      material: 'shelfTable',
    }));

    // 每個貨架的 ShelfInvisibleBulkSensor 物理體
    const setShelfSensorDetected = useShelfStore(state => state.setShelfSensorDetected);
    const getBoxData = useBoxStore(state => state.getBoxData);
    const setBoxCollidingWithEquipment = useBoxEquipStore(state => state.setBoxCollidingWithEquipment);
    const clearBoxCollision = useBoxEquipStore(state => state.clearBoxCollision);

    const [bulkSensorRef] = useBox(() => ({
      mass: 0,
      isTrigger: true,
      type: 'Static',
      position: sensorWorldPosition,
      rotation: shelf.rotation,
      args: sensorArgs,
      onCollideBegin: (e) => {
        const boxId = e.body.userData?.appId;
        if (boxId) {
          setShelfSensorDetected(shelf.id, 'BulkSensorDetected', true);
          clearBoxCollision(boxId);
          setBoxCollidingWithEquipment(boxId, shelf.id);
          const boxData = getBoxData(boxId);
          console.log(`Shelf ${shelf.id}: Box ID ${boxId} entered.`);
        }
      },
      onCollideEnd: (e) => {
        const boxId = e.body.userData?.appId;
        if (boxId) {
          setShelfSensorDetected(shelf.id, 'BulkSensorDetected', false);
          clearBoxCollision(boxId); // 清除此 Box 的碰撞狀態
          const boxData = getBoxData(boxId);
          console.log(`Shelf ${shelf.id}: Box ID ${boxId} left.`);
        }
      },
    }));

    return {
      shelfId: shelf.id,
      position: shelf.position,
      rotation: shelf.rotation,
      tableRef,
      bulkSensorRef,
    };
  });


  // 3. 渲染實例化網格和獨立傳感器
  return (
    <>
      {/* 實例化渲染 Table */}
      {tableGeometry && tableMaterial && (
        <Instances geometry={tableGeometry} material={tableMaterial}>
          {ShelfData.shelves.map((shelf) => (
            <Instance
              key={`${shelf.id}-table`}
              position={shelf.position}
              rotation={shelf.rotation}
            />
          ))}
        </Instances>
      )}

      {/* 實例化渲染 Legs */}
      {legGeometry && legMaterial && (
        <Instances geometry={legGeometry} material={legMaterial}>
          {ShelfData.shelves.map((shelf) => (
            // 因為 Legs 在 GLTF 模型中是相對於 Shelf 根部的，
            // 這裡需要為每個 Instance 應用它們的相對位置和旋轉。
            // 這是一個簡化：理想情況下你需要遍歷原始模型的 Leg_0 到 Leg_3 的本地位置和旋轉，
            // 然後為每個 Leg 在每個 Shelf 實例中生成一個 Instance。
            // 為了簡化，這裡假設所有 Legs 都可以統一實例化，並在 GLTF 模型的原點。
            // 如果你的腿部模型有獨立的本地位移，你需要修改這個部分。
            // 更精確的做法是為每個 Leg 單獨創建 Instances 組，並應用其本地變換。
            // 這裡為了保持簡潔，只為 Shelf 的總體位置/旋轉應用。
            <Instance
              key={`${shelf.id}-leg`}
              position={shelf.position}
              rotation={shelf.rotation}
            />
          ))}
        </Instances>
      )}

      {/* 為每個貨架渲染其獨立的物理傳感器（帶有 onCollide 事件） */}
      {shelfPhysicsBodies.map((shelfBody) => (
        // 使用一個 Group 來包含物理體，儘管這裡沒有視覺組件
        // 這樣可以將 ref 應用到 Group 上
        <group key={shelfBody.shelfId}>
          {/* 視覺化物理體 (可選，僅用於調試) */}
          {/*
          <mesh ref={shelfBody.tableRef}>
            <boxGeometry args={getLocalBoundingBoxSize(new THREE.Mesh(tableGeometry))} />
            <meshBasicMaterial color="blue" wireframe opacity={0.5} transparent />
          </mesh>
          <mesh ref={shelfBody.bulkSensorRef}>
            <boxGeometry args={getLocalBoundingBoxSize(new THREE.Mesh(bulkSensorGeometry))} />
            <meshBasicMaterial color="green" wireframe opacity={0.5} transparent />
          </mesh>
          */}
        </group>
      ))}
    </>
  );
}