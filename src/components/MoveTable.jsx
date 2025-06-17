import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useCraneStore } from '../stores/craneStore';
import { useFrame } from '@react-three/fiber';


// 輔助函數：獲取 Three.js 物件的本地尺寸 (通常用於創建碰撞體 args)
function getLocalBoundingBoxSize(mesh) {
  if (!mesh || !mesh.geometry) return [1, 1, 1];

  const bbox = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  return size.toArray();
}



export default function MoveTable({ id, craneWorldPosition, craneWorldRotation, modelPath }) {
  
    // const { scene } = useGLTF('/Crane_ver1.gltf');
    const { scene: fullCraneScene } = useGLTF('/Crane_ver1.gltf');


    const {
        currentMoveTableLocalOffset,
        targetMoveTableLocalOffset,
        moveTableSpeed,
        isCraneMoving, // 新增：判斷 Crane 主體是否在移動
        setMoveTableRef // Get the action to set moveTable ref

    } = useCraneStore(state => ({
        ...state.getCraneState(id),
        setMoveTableRef: state.setMoveTableRef //
    }));

    const updateMoveTableCurrentLocalOffset = useCraneStore(state => state.updateMoveTableCurrentLocalOffset);

    const moveTableMesh = useMemo(() => {
        let mesh = null;
        fullCraneScene.traverse((obj) => {
        if (obj.name === 'movePlate') {
            mesh = obj.clone();
            if (mesh.material) {
            mesh.material.transparent = true;
            mesh.material.opacity = 0;
            mesh.material.needsUpdate = true;
            }
            mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0;
                child.material.needsUpdate = true;
            }
            });
        }
        });
        return mesh;
    }, [fullCraneScene]);

    // ----------------- moveTable 物理體 -----------------
    // const moveTableDefaultProps = useMemo(() => {
    //     if (moveTableMesh && moveTableMesh.geometry) {
    //     const bbox = new THREE.Box3().setFromObject(moveTableMesh);
    //     const size = new THREE.Vector3();
    //     bbox.getSize(size);
    //     return { args: size.toArray() };
    //     }
    //     return { args: [1, 0.2, 1] }; // 預設值
    // }, [moveTableMesh]);


    const moveTableLocalProps = useMemo(() => {
        
        
        if (moveTableMesh) {
            // console.log('moveTableMesh:', moveTableMesh.position);
        return {
            
            position: moveTableMesh.position.toArray(), // 獲取本地位置
            // position: [0, 1, 0], // 預設值

            rotation: moveTableMesh.rotation.toArray(), // 獲取本地旋轉
            args: getLocalBoundingBoxSize(moveTableMesh), // 獲取本地尺寸
        };
        }
        console.warn('moveTableMesh is not available, using default props');
        return { position: [0,0,0], rotation: [0,0,0], args: [2, 1, 2] }; // 預設值
    }, [moveTableMesh]);


    // ----------------- moveTable 物理體 -----------------
    const [moveTableRef, moveTableApi] = useBox(() => ({
        mass: 0,
        type: 'Kinematic',
        // 初始位置是 Crane 的世界位置 + 本地偏移轉換為世界座標
        position: new THREE.Vector3(...craneWorldPosition)
                        .add(new THREE.Vector3(...currentMoveTableLocalOffset).applyEuler(new THREE.Euler(...craneWorldRotation)))
                        .toArray(),
        rotation: craneWorldRotation, // moveTable 和 Crane 保持相同的旋轉

        // args: moveTableDefaultProps.args, // changed to use moveTableLocalProps
        args: moveTableLocalProps.args,
        
        material: 'craneTable', // 用於與 Box 互動的材質

        userData: { id: `movePlate-${id}`, args: moveTableLocalProps.args }

    }));


    useEffect(() => {
        if (moveTableRef.current) {
            setMoveTableRef(id, moveTableRef); // Store the moveTable's physics body Ref
        }
        // Cleanup: Remove the ref from the store when the component unmounts
        return () => {
            setMoveTableRef(id, null);
        };
    }, [id, moveTableRef, setMoveTableRef]);


    // ----------------- useFrame for moveTable movement -----------------
    useFrame((state, delta) => {
        
        // 1. --- 相對於 Crane 的世界位置同步 (總是執行) ---
        // 這確保 moveTable 總是跟隨 Crane 主體的世界移動和旋轉

        // 獲取 Crane 的最新世界位置和旋轉 (從 props 傳入)
        const cranePos = new THREE.Vector3(...craneWorldPosition);
        const craneQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...craneWorldRotation));

        // 計算 moveTable 的世界位置：Crane 的世界位置 + currentMoveTableLocalOffset（經過 Crane 旋轉）
        const moveTableOffsetFromCrane = new THREE.Vector3(...currentMoveTableLocalOffset);
        moveTableOffsetFromCrane.applyQuaternion(craneQuat); // 將本地偏移量轉換為世界方向
        const moveTableActualWorldPosition = cranePos.clone().add(moveTableOffsetFromCrane);

        // 設定 moveTable 物理體的世界位置和旋轉
        moveTableApi.position.set(moveTableActualWorldPosition.x, moveTableActualWorldPosition.y, moveTableActualWorldPosition.z);
        moveTableApi.quaternion.set(craneQuat.x, craneQuat.y, craneQuat.z, craneQuat.w); // 保持與 Crane 同步旋轉


        // 2. --- moveTable 相對於 Crane 的自身移動邏輯 (條件執行) ---
        // 只有當 Crane 主體靜止且 moveTable 需要進行相對移動時才更新其 currentMoveTableLocalOffset
        if (!isCraneMoving && !currentMoveTableLocalOffset.equals(targetMoveTableLocalOffset)) {
            const distance = currentMoveTableLocalOffset.distanceTo(targetMoveTableLocalOffset);
            const moveDistance = moveTableSpeed * delta;

            if (moveDistance >= distance) {
                // 到達目標，直接設定最終偏移量
                updateMoveTableCurrentLocalOffset(id, targetMoveTableLocalOffset.toArray());
            } else {
                // 向目標移動
                const direction = targetMoveTableLocalOffset.clone().sub(currentMoveTableLocalOffset).normalize();
                const newLocalOffset = currentMoveTableLocalOffset.clone().add(direction.multiplyScalar(moveDistance));
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
        {moveTableLocalProps && (
            <mesh ref={moveTableRef}>
            <boxGeometry args={moveTableLocalProps.args} />
            <meshBasicMaterial color="orange" wireframe opacity={0.5} transparent />
            </mesh>
        )}
        </>
    );









}



