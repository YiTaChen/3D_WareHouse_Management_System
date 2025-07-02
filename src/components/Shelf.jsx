
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShelfStore } from '../stores/shelfStore';
import { useBoxStore } from '../stores/boxStore';
import { useBoxEquipStore } from '../stores/boxEquipStore';
import { useThree } from '@react-three/fiber';

// 共享材質
const SharedMaterials = {
  invisibleMaterial: null,
  transparentTableMaterial: null,
  transparentLegMaterial: null,
  initialized: false
};

function initializeSharedMaterials() {
  if (SharedMaterials.initialized) return;
  
  SharedMaterials.invisibleMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    visible: false,
  });
  
  SharedMaterials.transparentTableMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.5,
  });
  
  SharedMaterials.transparentLegMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.2,
  });
  
  SharedMaterials.initialized = true;
}

// 修改後的 Shelf 組件 - 支持視覺剔除但保持物理
function Shelf({ 
  id, 
  position, 
  rotation, 
  sharedScene, 
  isVisuallyVisible = true,  // 新增：控制視覺顯示
  alwaysKeepPhysics = true   // 新增：是否始終保持物理
}) {
  const setShelfSensorDetected = useShelfStore(state => state.setShelfSensorDetected);
  const getBoxData = useBoxStore(state => state.getBoxData);
  const setBoxCollidingWithEquipment = useBoxEquipStore(state => state.setBoxCollidingWithEquipment);
  const clearBoxCollision = useBoxEquipStore(state => state.clearBoxCollision);

  const clonedScene = useMemo(() => {
    if (!sharedScene || !position || !rotation) return null;
    
    const clone = sharedScene.clone(true);
    clone.position.set(position[0], position[1], position[2]);
    clone.rotation.set(rotation[0], rotation[1], rotation[2]);
    clone.updateMatrixWorld(true);
    
    // 🎯 關鍵：根據可見性設置整個場景的可見性
    clone.visible = isVisuallyVisible;
    
    return clone;
  }, [sharedScene, position, rotation, isVisuallyVisible]);

  const shelfParts = useMemo(() => {
    if (!clonedScene) return {};
    
    const parts = { legs: [] };
    
    clonedScene.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.name === 'table') {
          parts.table = obj;
          if (SharedMaterials.transparentTableMaterial) {
            obj.material = SharedMaterials.transparentTableMaterial.clone();
          }
        } else if (obj.name === 'ShelfInvisibleBulkSensor') {
          parts.bulkSensor = obj;
          obj.visible = false; // 感測器始終不可見
          if (SharedMaterials.invisibleMaterial) {
            obj.material = SharedMaterials.invisibleMaterial.clone();
          }
        } else if (obj.name.startsWith('Leg_')) {
          parts.legs.push(obj);
          if (SharedMaterials.transparentLegMaterial) {
            obj.material = SharedMaterials.transparentLegMaterial.clone();
          }
        }
      }
    });
    
    return parts;
  }, [clonedScene]);

  const getWorldProperties = (mesh) => {
    if (!mesh) return null;
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    mesh.updateWorldMatrix(true, false);
    mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
    const localSize = mesh.geometry?.boundingBox ?
      new THREE.Vector3().subVectors(mesh.geometry.boundingBox.max, mesh.geometry.boundingBox.min) :
      new THREE.Vector3(1, 1, 1);
    const finalSize = localSize.multiply(worldScale).toArray();
    const euler = new THREE.Euler().setFromQuaternion(worldQuaternion);
    return {
      position: worldPosition.toArray(),
      rotation: [euler.x, euler.y, euler.z],
      args: finalSize,
    };
  };

  const tableProps = useMemo(() => getWorldProperties(shelfParts.table), [shelfParts.table]);
  const bulkSensorProps = useMemo(() => getWorldProperties(shelfParts.bulkSensor), [shelfParts.bulkSensor]);

  // 🎯 關鍵：物理碰撞體始終存在（不受視覺可見性影響）
  const [tableRef] = useBox(() => ({
    mass: 0,
    type: 'Static',
    position: tableProps?.position || [0, 0, 0],
    rotation: tableProps?.rotation || [0, 0, 0],
    args: tableProps?.args || [1, 0.1, 1],
    material: 'shelfTable',
    // 物理碰撞體不受視覺剔除影響
  }));

  const [bulkSensorRef] = useBox(() => ({
    mass: 0,
    isTrigger: true,
    type: 'Static',
    position: bulkSensorProps?.position || [0, 0, 0],
    rotation: bulkSensorProps?.rotation || [0, 0, 0],
    args: bulkSensorProps?.args || [1, 1, 1],
    onCollideBegin: (e) => {
      const boxId = e.body.userData?.appId;
      if (boxId) {
        setShelfSensorDetected(id, 'BulkSensorDetected', true);

        // clear last collision with equipment (normally crane)
        clearBoxCollision(boxId);
        // set new collision with equipment
        setBoxCollidingWithEquipment(boxId, id);
        
        
        // 🎯 可選：當 box 碰撞時顯示調試信息
        if (!isVisuallyVisible) {
          // console.log(`📦 Box ${boxId} 與不可見的 Shelf ${id} 發生碰撞`);
        }
      }
    },
    onCollideEnd: (e) => {
      const boxId = e.body.userData?.appId;
      if (boxId) {
        setShelfSensorDetected(id, 'BulkSensorDetected', false);
      }
    },
  }));

  // 🎯 關鍵：始終返回視覺組件（由 visible 屬性控制顯示）
  if (!clonedScene) return null;
  return <primitive object={clonedScene} />;
}

// 批量載入的 Shelf 組件 - 支持視覺剔除
export default function BatchedShelfLoader({ 
  shelves, 
  batchSize = 20,
  batchInterval = 300,
  maxConcurrent = 20000,
  enableVisualCulling = true,    // 🎯 改名：視覺剔除
  visualCullingDistance = 100,   // 🎯 改名：視覺剔除距離
  enablePhysicsCulling = false,  // 🎯 新增：物理剔除（通常不建議開啟）
  physicsCullingDistance = 200,  // 🎯 新增：物理剔除距離
  cameraRef = null
}) {
  const { scene } = useGLTF('/Shelf_ver1.gltf');
  const { camera } = useThree();
  const [loadedBatches, setLoadedBatches] = useState(0);
  const [visuallyVisibleShelves, setVisuallyVisibleShelves] = useState(new Set());
  const [physicallyActiveShelves, setPhysicallyActiveShelves] = useState(new Set());
  const loadingRef = useRef(false);
  const timeoutRef = useRef(null);

  const activeCamera = cameraRef || camera;

  useEffect(() => {
    initializeSharedMaterials();
  }, []);

  useEffect(() => {
    if (!scene || !shelves?.length || loadingRef.current) return;
    
    loadingRef.current = true;
    let currentBatch = 0;
    const totalBatches = Math.ceil(shelves.length / batchSize);
    
    const loadNextBatch = () => {
      if (currentBatch >= totalBatches) {
        loadingRef.current = false;
        // console.log(`✅ 所有 ${shelves.length} 個 Shelf 載入完成`);
        return;
      }
      
      setLoadedBatches(currentBatch + 1);
      // console.log(`📦 載入批次 ${currentBatch + 1}/${totalBatches} (${Math.min((currentBatch + 1) * batchSize, shelves.length)}/${shelves.length})`);
      
      currentBatch++;
      
      if (currentBatch < totalBatches) {
        timeoutRef.current = setTimeout(loadNextBatch, batchInterval);
      } else {
        loadingRef.current = false;
      }
    };
    
    loadNextBatch();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      loadingRef.current = false;
    };
  }, [scene, shelves, batchSize, batchInterval]);

  // 🎯 關鍵：分別處理視覺和物理剔除
  useFrame((state) => {
    if (!activeCamera || !shelves?.length) return;
    
    const cameraPosition = activeCamera.position;
    const newVisuallyVisible = new Set();
    const newPhysicallyActive = new Set();
    
    const maxLoadedIndex = Math.min(loadedBatches * batchSize, shelves.length);
    
    for (let i = 0; i < maxLoadedIndex; i++) {
      const shelf = shelves[i];
      if (!shelf.position) continue;
      
      const distance = Math.sqrt(
        Math.pow(cameraPosition.x - shelf.position[0], 2) +
        Math.pow(cameraPosition.y - shelf.position[1], 2) +
        Math.pow(cameraPosition.z - shelf.position[2], 2)
      );
      
      // 視覺剔除判斷
      if (!enableVisualCulling || distance <= visualCullingDistance) {
        newVisuallyVisible.add(shelf.id);
      }
      
      // 物理剔除判斷（通常不建議開啟）
      if (!enablePhysicsCulling || distance <= physicsCullingDistance) {
        newPhysicallyActive.add(shelf.id);
      }
    }
    
    // 更新視覺可見性
    if (newVisuallyVisible.size !== visuallyVisibleShelves.size || 
        [...newVisuallyVisible].some(id => !visuallyVisibleShelves.has(id))) {
      setVisuallyVisibleShelves(newVisuallyVisible);
    }
    
    // 更新物理活躍性
    if (enablePhysicsCulling && 
        (newPhysicallyActive.size !== physicallyActiveShelves.size || 
         [...newPhysicallyActive].some(id => !physicallyActiveShelves.has(id)))) {
      setPhysicallyActiveShelves(newPhysicallyActive);
    }
  });

  // 計算要渲染的 Shelf
  const shelvesToRender = useMemo(() => {
    const maxToLoad = Math.min(loadedBatches * batchSize, shelves?.length || 0);
    let shelvesToLoad = shelves?.slice(0, maxToLoad) || [];
    
    // 🎯 關鍵：如果啟用物理剔除，只載入物理活躍的 shelf
    if (enablePhysicsCulling && activeCamera) {
      shelvesToLoad = shelvesToLoad.filter(shelf => physicallyActiveShelves.has(shelf.id));
    }
    
    return shelvesToLoad.slice(0, maxConcurrent);
  }, [shelves, loadedBatches, batchSize, physicallyActiveShelves, enablePhysicsCulling, maxConcurrent, activeCamera]);

  const loadingProgress = useMemo(() => {
    if (!shelves?.length) return 100;
    return Math.min((loadedBatches * batchSize / shelves.length) * 100, 100);
  }, [loadedBatches, batchSize, shelves?.length]);

  if (!scene) {
    return <div>載入 Shelf 模型中...</div>;
  }

  return (
    <>
      {/* 調試信息顯示 */}
      {/* <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000,
        fontFamily: 'monospace'
      }}>
        <div>載入進度: {loadingProgress.toFixed(1)}%</div>
        <div>總數: {shelves?.length || 0}</div>
        <div>已載入: {Math.min(loadedBatches * batchSize, shelves?.length || 0)}</div>
        <div>📱 視覺可見: {visuallyVisibleShelves.size}</div>
        <div>⚽ 物理活躍: {enablePhysicsCulling ? physicallyActiveShelves.size : '全部'}</div>
        <div>🎮 實際渲染: {shelvesToRender.length}</div>
        <div>👁️ 視覺距離: {visualCullingDistance}</div>
        {enablePhysicsCulling && <div>⚡ 物理距離: {physicsCullingDistance}</div>}
        <div>📍 相機位置: {activeCamera ? 
          `(${activeCamera.position.x.toFixed(1)}, ${activeCamera.position.y.toFixed(1)}, ${activeCamera.position.z.toFixed(1)})` 
          : '未找到'}</div>
      </div> */}
      
      {/* 🎯 關鍵：渲染所有 shelf，但分別控制視覺和物理 */}
      {shelvesToRender.map((shelf) => (
        <Shelf
          key={shelf.id}
          id={shelf.id}
          position={shelf.position}
          rotation={shelf.rotation}
          sharedScene={scene}
          isVisuallyVisible={visuallyVisibleShelves.has(shelf.id)}  // 🎯 視覺控制
          alwaysKeepPhysics={!enablePhysicsCulling || physicallyActiveShelves.has(shelf.id)}  // 🎯 物理控制
        />
      ))}
    </>
  );
}

// 具名導出的簡化版本
export function QuickShelfBatch({ shelves }) {
  return (
    <BatchedShelfLoader
      shelves={shelves}
      batchSize={30}
      batchInterval={50}
      enableVisualCulling={false}
      enablePhysicsCulling={false}
    />
  );
}

// 🎯 視覺剔除版本（推薦）- 看不見但物理還在
export function VisualCullingShelfBatch({ shelves, cameraRef }) {
  const { camera } = useThree();
  
  return (
    <BatchedShelfLoader
      shelves={shelves}
      batchSize={10}
      batchInterval={15}
      maxConcurrent={2000}
      enableVisualCulling={true}      // ✅ 啟用視覺剔除
      visualCullingDistance={55}      // 📱 視覺剔除距離
      enablePhysicsCulling={false}    // ❌ 關閉物理剔除（保持物理碰撞）
      cameraRef={cameraRef || camera}
    />
  );
}

// 🎯 完全剔除版本（性能最佳但可能影響遊戲性）
export function FullCullingShelfBatch({ shelves, cameraRef }) {
  const { camera } = useThree();
  
  return (
    <BatchedShelfLoader
      shelves={shelves}
      batchSize={5}
      batchInterval={200}
      maxConcurrent={100}
      enableVisualCulling={true}      // ✅ 啟用視覺剔除
      visualCullingDistance={30}      // 📱 視覺剔除距離
      enablePhysicsCulling={true}     // ⚡ 啟用物理剔除
      physicsCullingDistance={100}    // ⚽ 物理剔除距離
      cameraRef={cameraRef || camera}
    />
  );
}