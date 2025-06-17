

import * as THREE from 'three';

/**
 * 獲取 Three.js Mesh 在世界空間中的位置、旋轉和計算後的邊界框尺寸。
 * 對於具有複雜父子層級的模型特別有用。
 * @param {THREE.Mesh | THREE.Object3D} mesh - 要獲取屬性的 Three.js 網格或物件。
 * @returns {{position: number[], rotation: number[], args: number[]}} - 包含世界位置、旋轉 (Euler) 和尺寸的物件，或 null 如果 mesh 無效。
 */
export function getWorldProperties(mesh) {
  if (!mesh) return null;

  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();

  // 確保世界矩陣是最新的，這對正確獲取世界屬性至關重要
  mesh.updateWorldMatrix(true, false);
  mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

  // 計算本地尺寸，並乘上世界縮放得到最終尺寸
  const localSize = mesh.geometry && mesh.geometry.boundingBox ?
    new THREE.Vector3().subVectors(mesh.geometry.boundingBox.max, mesh.geometry.boundingBox.min) :
    new THREE.Vector3(1, 1, 1); // 如果沒有 boundingBox (例如 Group)，提供 fallback
  const finalSize = localSize.multiply(worldScale).toArray();

  // 將世界 Quaternion 轉換為 Euler 角度
  const euler = new THREE.Euler().setFromQuaternion(worldQuaternion);
  const rotationArray = [euler.x, euler.y, euler.z];

  return {
    position: worldPosition.toArray(),
    rotation: rotationArray,
    args: finalSize,
  };
}

