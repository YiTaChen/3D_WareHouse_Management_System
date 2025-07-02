import React, { useMemo, useEffect } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei'; // 使用 drei 的 useGLTF
import { useBoxStore } from '../stores/boxStore';

// 預載入模型（這樣所有實例都能共享同一個載入的模型）
useGLTF.preload('/box_ver1.gltf');

export default function Box({ id, initialPosition }) {
  const boxSize = [1, 1, 1];
  
  const boxData = useBoxStore(state => state.getBoxData(id));
  const setBoxRef = useBoxStore(state => state.setBoxRef);
  
  if (!boxData) {
    console.warn(`Box component with ID ${id} rendered without boxData. Skipping.`);
    return null;
  }

  // 使用 useGLTF hook 同步載入模型
  const { scene } = useGLTF('/box_ver1.gltf');
  
  // 使用 useMemo 來複製 scene，避免直接修改原始模型
  const boxMesh = useMemo(() => {
    const clonedScene = scene.clone();
    
    // 對模型進行設置
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clonedScene;
  }, [scene]);

  // 創建物理體（現在模型已經同步可用）
  const [boxBodyRef, boxBodyApi] = useBox(() => ({
    mass: 1,
    position: boxData.position,
    type: 'Dynamic',
    args: boxSize,
    material: 'box',
    sleepSpeedLimit: 0.1,
    sleepTimeLimit: 1,
    allowSleep: true,
    userData: {
      appId: id,
      name: boxData ? boxData.name : 'Unknown Box',
      content: boxData ? boxData.content : 'No Content',
      type: 'box',
      size: boxSize,
    },
  }));

  useEffect(() => {
    if (boxBodyRef.current && boxBodyApi) {
      // console.log(`Setting box ref for ${id}:`, boxBodyRef.current);
      const fullRef = {
        ref: boxBodyRef,
        api: boxBodyApi,
        isReady: true,
        id: id
      };
      setBoxRef(id, fullRef);
    }
    
    return () => {
      console.log(`Cleaning up box ref for ${id}`);
      setBoxRef(id, null);
    };
  }, [id, boxBodyRef, boxBodyApi, setBoxRef]);

  return (
    <group ref={boxBodyRef}>
      <primitive object={boxMesh} />
    </group>
  );
}



