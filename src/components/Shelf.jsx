
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShelfStore } from '../stores/shelfStore';
import { useBoxEquipStore } from '../stores/boxEquipStore';
import { useBoxStore } from '../stores/boxStore';
import { useThree } from '@react-three/fiber';
import {
  createShelfRows,
  getNearestShelfInRow,
  getShelfRowBody,
} from './shelfLayout';

// 共享材質
const SharedMaterials = {
  transparentTableMaterial: null,
  transparentLegMaterial: null,
  initialized: false
};

function initializeSharedMaterials() {
  if (SharedMaterials.initialized) return;
  
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

function getWorldProperties(mesh) {
  if (!mesh) return null;

  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();
  mesh.updateWorldMatrix(true, false);
  mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

  if (!mesh.geometry.boundingBox) {
    mesh.geometry.computeBoundingBox();
  }

  const localSize = mesh.geometry.boundingBox
    ? new THREE.Vector3().subVectors(mesh.geometry.boundingBox.max, mesh.geometry.boundingBox.min)
    : new THREE.Vector3(1, 1, 1);
  const euler = new THREE.Euler().setFromQuaternion(worldQuaternion);

  return {
    position: worldPosition.toArray(),
    rotation: [euler.x, euler.y, euler.z],
    args: localSize.multiply(worldScale).toArray(),
  };
}

function InstancedShelfVisuals({ shelves, sharedScene, maxInstances }) {
  const meshRefs = useRef(new Map());

  const visualParts = useMemo(() => {
    if (!sharedScene) return [];

    initializeSharedMaterials();
    sharedScene.updateMatrixWorld(true);
    const parts = [];

    sharedScene.traverse((obj) => {
      if (!obj.isMesh || obj.name === 'ShelfInvisibleBulkSensor') return;

      const material = obj.name === 'table'
        ? SharedMaterials.transparentTableMaterial
        : SharedMaterials.transparentLegMaterial;

      parts.push({
        geometry: obj.geometry,
        localMatrix: obj.matrixWorld.clone(),
        material,
        name: obj.name,
      });
    });

    return parts;
  }, [sharedScene]);

  useLayoutEffect(() => {
    const shelfMatrix = new THREE.Matrix4();
    const instanceMatrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    for (const part of visualParts) {
      const mesh = meshRefs.current.get(part.name);
      if (!mesh) continue;

      mesh.count = shelves.length;
      for (let index = 0; index < shelves.length; index += 1) {
        const shelf = shelves[index];
        position.set(...shelf.position);
        quaternion.setFromEuler(new THREE.Euler(...shelf.rotation, 'XYZ'));
        shelfMatrix.compose(position, quaternion, scale);
        instanceMatrix.multiplyMatrices(shelfMatrix, part.localMatrix);
        mesh.setMatrixAt(index, instanceMatrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [shelves, visualParts]);

  return visualParts.map((part) => (
    <instancedMesh
      key={part.name}
      ref={(node) => {
        if (node) meshRefs.current.set(part.name, node);
        else meshRefs.current.delete(part.name);
      }}
      args={[part.geometry, part.material, maxInstances]}
    />
  ));
}

function ShelfRowPhysics({ row, tableTemplate, bulkSensorTemplate }) {
  const setShelfSensorDetected = useShelfStore(state => state.setShelfSensorDetected);
  const setBoxCollidingWithEquipment = useBoxEquipStore(state => state.setBoxCollidingWithEquipment);
  const clearBoxCollision = useBoxEquipStore(state => state.clearBoxCollision);
  const collidingShelfByBox = useRef(new Map());

  const tableBody = useMemo(() => getShelfRowBody(row, tableTemplate), [row, tableTemplate]);
  const sensorBody = useMemo(() => getShelfRowBody(row, bulkSensorTemplate), [row, bulkSensorTemplate]);

  useBox(() => ({
    mass: 0,
    type: 'Static',
    position: tableBody.position,
    rotation: tableBody.rotation,
    args: tableBody.args,
    material: 'shelfTable',
  }));

  useBox(() => ({
    mass: 0,
    type: 'Static',
    isTrigger: true,
    position: sensorBody.position,
    rotation: sensorBody.rotation,
    args: sensorBody.args,
    onCollideBegin: (e) => {
      const boxId = e.body.userData?.appId;
      if (!boxId) return;

      const boxPosition = useBoxStore.getState().getBoxWorldPosition(boxId);
      const boxX = boxPosition?.[0] ?? row.shelves[0].position[0];
      const nearestShelf = getNearestShelfInRow(row, boxX);

      collidingShelfByBox.current.set(boxId, nearestShelf.id);
      setShelfSensorDetected(nearestShelf.id, 'BulkSensorDetected', true);
      clearBoxCollision(boxId);
      setBoxCollidingWithEquipment(boxId, nearestShelf.id);
    },
    onCollideEnd: (e) => {
      const boxId = e.body.userData?.appId;
      const shelfId = boxId ? collidingShelfByBox.current.get(boxId) : null;
      if (!boxId || !shelfId) return;

      setShelfSensorDetected(shelfId, 'BulkSensorDetected', false);
      collidingShelfByBox.current.delete(boxId);
    },
  }));

  return null;
}

// 批量載入的 Shelf 組件 - 支持視覺剔除
export default function BatchedShelfLoader({ 
  shelves, 
  batchSize = 20,
  batchInterval = 300,
  maxConcurrent = 20000,
  enableVisualCulling = true,
  visualCullingDistance = 100,
  cameraRef = null
}) {
  const { scene } = useGLTF('/Shelf_ver1.gltf');
  const { camera } = useThree();
  const [loadedBatches, setLoadedBatches] = useState(0);
  const [visuallyVisibleShelves, setVisuallyVisibleShelves] = useState(new Set());
  const loadingRef = useRef(false);
  const timeoutRef = useRef(null);
  const lastCullingCheck = useRef({
    loadedBatches: -1,
    position: new THREE.Vector3(Number.POSITIVE_INFINITY, 0, 0),
    time: Number.NEGATIVE_INFINITY,
  });

  const activeCamera = cameraRef || camera;

  const shelfPartTemplates = useMemo(() => {
    if (!scene) return null;

    scene.updateMatrixWorld(true);
    let table = null;
    let bulkSensor = null;

    scene.traverse((obj) => {
      if (obj.name === 'table') table = getWorldProperties(obj);
      if (obj.name === 'ShelfInvisibleBulkSensor') bulkSensor = getWorldProperties(obj);
    });

    return table && bulkSensor ? { table, bulkSensor } : null;
  }, [scene]);

  const shelfRows = useMemo(() => createShelfRows(shelves), [shelves]);

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

  useFrame((state) => {
    if (!activeCamera || !shelves?.length) return;

    const elapsedTime = state.clock.elapsedTime;
    const previousCheck = lastCullingCheck.current;
    if (elapsedTime - previousCheck.time < 0.25) return;

    const cameraPosition = activeCamera.position;
    const cameraMoved = cameraPosition.distanceToSquared(previousCheck.position) > 0.25;
    const loadedShelvesChanged = previousCheck.loadedBatches !== loadedBatches;
    if (!cameraMoved && !loadedShelvesChanged) {
      previousCheck.time = elapsedTime;
      return;
    }

    const newVisuallyVisible = new Set();
    
    const maxLoadedIndex = Math.min(loadedBatches * batchSize, shelves.length);
    
    for (let i = 0; i < maxLoadedIndex; i++) {
      const shelf = shelves[i];
      if (!shelf.position) continue;
      
      const dx = cameraPosition.x - shelf.position[0];
      const dy = cameraPosition.y - shelf.position[1];
      const dz = cameraPosition.z - shelf.position[2];
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      
      if (!enableVisualCulling || distanceSquared <= visualCullingDistance * visualCullingDistance) {
        newVisuallyVisible.add(shelf.id);
      }
    }

    if (newVisuallyVisible.size !== visuallyVisibleShelves.size || 
        [...newVisuallyVisible].some(id => !visuallyVisibleShelves.has(id))) {
      setVisuallyVisibleShelves(newVisuallyVisible);
    }

    previousCheck.position.copy(cameraPosition);
    previousCheck.loadedBatches = loadedBatches;
    previousCheck.time = elapsedTime;
  });

  const shelvesToRender = useMemo(() => {
    const maxToLoad = Math.min(loadedBatches * batchSize, shelves?.length || 0);
    return (shelves?.slice(0, maxToLoad) || []).slice(0, maxConcurrent);
  }, [shelves, loadedBatches, batchSize, maxConcurrent]);

  if (!scene) {
    return <div>載入 Shelf 模型中...</div>;
  }

  return (
    <>
      {shelfPartTemplates && shelfRows.map((row) => (
        <ShelfRowPhysics
          key={`physics-${row.key}`}
          row={row}
          tableTemplate={shelfPartTemplates.table}
          bulkSensorTemplate={shelfPartTemplates.bulkSensor}
        />
      ))}

      <InstancedShelfVisuals
        shelves={shelvesToRender.filter((shelf) => visuallyVisibleShelves.has(shelf.id))}
        sharedScene={scene}
        maxInstances={shelves.length}
      />
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
      enableVisualCulling={true}
      visualCullingDistance={55}
      cameraRef={cameraRef || camera}
    />
  );
}

// More aggressive visual culling for constrained devices.
export function FullCullingShelfBatch({ shelves, cameraRef }) {
  const { camera } = useThree();
  
  return (
    <BatchedShelfLoader
      shelves={shelves}
      batchSize={5}
      batchInterval={200}
      maxConcurrent={100}
      enableVisualCulling={true}
      visualCullingDistance={30}
      cameraRef={cameraRef || camera}
    />
  );
}
