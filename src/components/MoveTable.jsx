import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useCraneStore } from '../stores/craneStore';
import { useFrame } from '@react-three/fiber';


function getWorldProperties(mesh) {
    if (!mesh) return null;

    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();

    mesh.updateWorldMatrix(true, false);
    mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

    const localSize = mesh.geometry && mesh.geometry.boundingBox ?
        new THREE.Vector3().subVectors(mesh.geometry.boundingBox.max, mesh.geometry.boundingBox.min) :
        new THREE.Vector3(1, 1, 1);
    const finalSize = localSize.multiply(worldScale).toArray();

    const euler = new THREE.Euler().setFromQuaternion(worldQuaternion);
    const rotationArray = [euler.x, euler.y, euler.z];

    return {
        position: worldPosition.toArray(),
        rotation: rotationArray,
        args: finalSize,
    };
}



export default function MoveTable({ id, craneWorldPosition, craneWorldRotation, modelPath }) {
  
    const { scene } = useGLTF('/Crane_ver1.gltf');

    const {
        currentMoveTableLocalOffset,
        targetMoveTableLocalOffset,
        moveTableSpeed,
        isCraneMoving, // 新增：判斷 Crane 主體是否在移動
    } = useCraneStore(state => state.getCraneState(id));

    const updateMoveTableCurrentLocalOffset = useCraneStore(state => state.updateMoveTableCurrentLocalOffset);

    // 提取 moveTable 網格
    const moveTableMesh = useMemo(() => {
        let mesh = null;
        scene.traverse((obj) => {
        if (obj.name === 'moveTable') {
            mesh = obj.clone(); // 克隆 moveTable，確保它獨立
            // 確保原始 GLTF 中的 moveTable 是隱形的
            if (mesh.material) {
                mesh.material.transparent = true;
                mesh.material.opacity = 0; // 完全透明
                mesh.material.needsUpdate = true;
            }
            // 如果 moveTable 是一個組，裡面有子網格，需要遍歷它們
            mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material = child.material.clone(); // 克隆材質以避免修改原始
                    child.material.transparent = true;
                    child.material.opacity = 0;
                    child.material.needsUpdate = true;
                }
            });
        }
        });
        return mesh;
    }, [scene]);

    // ----------------- moveTable 物理體 -----------------
    const moveTableDefaultProps = useMemo(() => {
        if (moveTableMesh && moveTableMesh.geometry) {
        const bbox = new THREE.Box3().setFromObject(moveTableMesh);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        return { args: size.toArray() };
        }
        return { args: [1, 0.2, 1] }; // 預設值
    }, [moveTableMesh]);



    // ----------------- useFrame for moveTable movement -----------------
    useFrame((state, delta) => {
        // 只有當 Crane 主體不移動時，moveTable 才能移動
        if (!isCraneMoving && !currentMoveTableLocalOffset.equals(targetMoveTableLocalOffset)) {
        // 獲取 Crane 的最新世界位置和旋轉 (因為 Crane 自己可能在移動)
        const cranePos = new THREE.Vector3(...craneWorldPosition);
        const craneQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...craneWorldRotation));

        // 計算 moveTable 的世界目標位置
        const targetMoveTableWorldPosition = cranePos.clone().add(
            targetMoveTableLocalOffset.clone().applyQuaternion(craneQuat)
        );

        // 獲取 moveTable 的當前世界位置
        const currentMoveTableWorldPosition = new THREE.Vector3();
        moveTableRef.current.getWorldPosition(currentMoveTableWorldPosition);

        const distance = currentMoveTableWorldPosition.distanceTo(targetMoveTableWorldPosition);
        const moveDistance = moveTableSpeed * delta;

        if (moveDistance >= distance) {
            moveTableApi.position.set(targetMoveTableWorldPosition.x, targetMoveTableWorldPosition.y, targetMoveTableWorldPosition.z);
            // 到達目標後，更新 store 中的本地偏移為最終目標值
            updateMoveTableCurrentLocalOffset(id, targetMoveTableLocalOffset.toArray());
        } else {
            const direction = targetMoveTableWorldPosition.clone().sub(currentMoveTableWorldPosition).normalize();
            const newWorldPosition = currentMoveTableWorldPosition.clone().add(direction.multiplyScalar(moveDistance));
            moveTableApi.position.set(newWorldPosition.x, newWorldPosition.y, newWorldPosition.z);

            // 反向計算新的本地偏移，用於更新 store 狀態
            // (新世界位置 - Crane世界位置) 應用 Crane 世界旋轉的逆向四元數
            const newLocalOffset = newWorldPosition.clone().sub(cranePos).applyQuaternion(craneQuat.clone().invert());
            updateMoveTableCurrentLocalOffset(id, newLocalOffset.toArray());
        }
        }
    });

    return (
        <>
        {/* 單獨渲染 moveTable 的網格，作為其物理體的子項 */}
        {moveTableMesh && (
            <primitive object={moveTableMesh} ref={moveTableRef} />
        )}

        {/* 為了調試，可以渲染 moveTable 的物理碰撞箱 */}
        {/* {moveTableDefaultProps && (
            <mesh ref={moveTableRef}>
            <boxGeometry args={moveTableDefaultProps.args} />
            <meshBasicMaterial color="orange" wireframe opacity={0.5} transparent />
            </mesh>
        )} */}
        </>
    );









}



