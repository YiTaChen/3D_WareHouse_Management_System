
import React, { useMemo } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useBoxStore } from '../stores/boxStore'; // 引入 boxStore




export default function Box({ id, initialPosition }) {
 const boxSize = [1, 1, 1]

const boxData = useBoxStore(state => state.getBoxData(id)); // 從 store 獲取 box 的資料

  console.log(`Box ID: ${id}, Box Data:`, boxData); // 確認 boxData 是否正確獲取
  console.log(`Box ID: ${id}, Initial Position:`, initialPosition); // 確認 initialPosition 是否正確

  const [ref] = useBox(() => ({
    mass: 1,
    position: boxData.AddNewBoxPosition ? boxData.AddNewBoxPosition :initialPosition,
    args: boxSize,
    material: 'box',
    linearDamping: 0.9,
    angularDamping: 0.9,
    sleepSpeedLimit: 0.1, // Velocity threshold to fall asleep (default is 0.1)
    sleepTimeLimit: 1,    // Time (in seconds) to stay below threshold before sleeping (default is 1)
    allowSleep: true,     // Explicitly allow this body to sleep
    userData: {
      appId: id, // 將 id 存入 userData
      name: boxData ? boxData.name : 'Unknown Box', // 使用 boxData 的 name
      content: boxData ? boxData.content : 'No Content', // 使用 boxData 的 content
      type: 'box',
      size: boxSize,
    },
  }))


  const displayColor = useMemo(() => {
    if (boxData) {
      if (boxData.name === 'Red Box') return 'red';
      if (boxData.name === 'Blue Box') return 'blue';
    }
    return 'skyblue'; // 預設顏色
  }, [boxData]);


  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={boxSize} />
      <meshStandardMaterial color={displayColor} />
    </mesh>
  )
}
