import React, { useRef } from 'react'; // 移除了 useEffect, useState
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { MathUtils } from 'three';

export default function HighlightSpot({ position = [0, 0, 0] }) { // 移除了 duration
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // 閃爍效果：使用正弦波在透明度 0.2 和 0.8 之間變化
      // 這裡的 clock.getElapsedTime() 可以用來模擬連續的閃爍
      const opacity = Math.sin(clock.getElapsedTime() * 10) * 0.3 + 0.5; // 頻率 10, 範圍 0.2-0.8
      meshRef.current.material.opacity = opacity;
    }
  });

  return (
    <Sphere args={[0.7, 32, 32]} position={position} ref={meshRef}>
      <meshBasicMaterial color="red" transparent opacity={0.5} depthWrite={false} />
    </Sphere>
  );
}


