
import React, { useMemo, useEffect } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useBoxStore } from '../stores/boxStore'; // 引入 boxStore




export default function Box({ id, initialPosition }) {
  const boxSize = [1, 1, 1]

  const boxData = useBoxStore(state => state.getBoxData(id)); // 從 store 獲取 box 的資料
  const setBoxRef = useBoxStore(state => state.setBoxRef); // 獲取 set Box Ref 的 action

  // console.log('boxData:', boxData); // 確認 boxData 是否正確獲取

  if (!boxData) {
    console.warn(`Box component with ID ${id} rendered without boxData. Skipping.`);
    return null; // Or render a placeholder/error state
  }

  // console.log(`Box ID: ${id}, Box Data:`, boxData); // 確認 boxData 是否正確獲取
  // console.log(`Box ID: ${id}, Initial Position:`, initialPosition); // 確認 initialPosition 是否正確

  // const [boxBodyRef] = useBox(() => ({
  //   mass: 1,
  //   // position: boxData.position ? boxData.position :initialPosition,
  //   position: boxData.position, // <--- Directly use boxData.position
  //   args: boxSize,
  //   material: 'box',
  //   linearDamping: 0.9,
  //   angularDamping: 0.9,
  //   sleepSpeedLimit: 0.1, // Velocity threshold to fall asleep (default is 0.1)
  //   sleepTimeLimit: 1,    // Time (in seconds) to stay below threshold before sleeping (default is 1)
  //   allowSleep: true,     // Explicitly allow this body to sleep
  //   userData: {
  //     appId: id, // 將 id 存入 userData
  //     name: boxData ? boxData.name : 'Unknown Box', // 使用 boxData 的 name
  //     content: boxData ? boxData.content : 'No Content', // 使用 boxData 的 content
  //     type: 'box',
  //     size: boxSize,
  //   },
  // }))


  const [boxBodyRef, boxBodyApi] = useBox(() => ({
    mass: 1,
    position: boxData.position,
    type: 'Dynamic',
    args: boxSize,
    material: 'box',
    linearDamping: 0.9,
    angularDamping: 1,
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

  //   // 使用 useEffect 來設置 Box 的物理體 Ref
  //   useEffect(() => {
  //   if (boxBodyRef.current) {
  //     console.log(`Setting box ref for ${id}:`, boxBodyRef.current);
  //     setBoxRef(id, boxBodyRef); // 將 Box 的物理體 Ref 存儲到 store
  //   }
    
  //   // 清理函數
  //   return () => {
  //     console.log(`Cleaning up box ref for ${id}`);
  //     setBoxRef(id, null);
  //   };
  // }, [id, boxBodyRef, setBoxRef]);


  useEffect(() => {
    if (boxBodyRef.current && boxBodyApi) {
      console.log(`Setting box ref for ${id}:`, boxBodyRef.current);
      
      // 創建完整的 ref 結構
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




  const displayColor = useMemo(() => {
    if (boxData) {
      if (boxData.name === 'Red Box') return 'red';
      if (boxData.name === 'Blue Box') return 'blue';
    }
    return 'skyblue'; // 預設顏色
  }, [boxData]);


  return (
    <mesh ref={boxBodyRef} castShadow>
      <boxGeometry args={boxSize} />
      <meshStandardMaterial color={displayColor} />
    </mesh>
  )
}
