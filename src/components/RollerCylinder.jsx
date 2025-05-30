// src/components/RollerCylinder.jsx
import React, { useEffect } from 'react'
import { useCylinder } from '@react-three/cannon'
import * as THREE from 'three'

export default function RollerCylinder({ roller_position, equip_position, rotation, size, rotate, key11, radius, length, roller_rotate_deg_Array }) {
  // const radius = (size[0] + size[1]) / 4
  // const length = size[2]
  // console.log('RollerCylinder key:', key11,'roller_rotate_deg_Array:', roller_rotate_deg_Array)

  // console.log('RollerCylinder key:', key11, ' ,RollerCylinder position:', roller_position, 'equip_position:', equip_position)

  const euler = new THREE.Euler().setFromQuaternion(rotation)
  // euler.x += Math.PI / 2 // 修正 cannon 的 Z 軸 cylinder 長度方向
  // const temp = euler.y
  // euler.y = euler.z
  // euler.z = temp // 修正 cannon 的 Y 軸 cylinder 長度方向

  const rotationArray = [euler.x, euler.y, euler.z]

  // console.log( 'key:', key11 ,' ,RollerCylinder position:', position)
  const [ref, api] = useCylinder(() => ({
    mass: 0,
    position: roller_position,
    rotation: rotationArray,
    args: [radius, radius, length, 16],
    material: 'roller',
    type: 'Kinematic',
  }))
//   console.log('RollerCylinder rotate:', rotate)
  useEffect(() => {

  // api.angularVelocity.set(rotate ? 0 : 0, rotate ? 0 : 0, rotate ? 1 : 0)
  api.angularVelocity.set(rotate ? roller_rotate_deg_Array[0] : 0, rotate ? roller_rotate_deg_Array[1] : 0, rotate ? roller_rotate_deg_Array[2] : 0)
   
  }, [rotate])

  return (
    <mesh ref={ref} rotation={rotationArray} position={roller_position} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color="orange" opacity={0.5} transparent />
    </mesh>
  )
}
