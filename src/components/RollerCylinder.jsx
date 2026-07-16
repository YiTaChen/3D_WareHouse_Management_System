// src/components/RollerCylinder.jsx
import React, { useEffect } from 'react'
import { useCylinder } from '@react-three/cannon'
import * as THREE from 'three'

export default function RollerCylinder({ rollerPosition, rotation, radius, length, angularVelocity, rotate }) {
  const euler = new THREE.Euler().setFromQuaternion(rotation)
  const rotationArray = [euler.x, euler.y, euler.z]

  const [, api] = useCylinder(() => ({
    mass: 0,
    position: rollerPosition,
    rotation: rotationArray,
    args: [radius, radius, length, 16],
    material: 'roller',
    type: rotate ? 'Kinematic' : 'Static',
  }), undefined, [rotate])

  useEffect(() => {
    api.angularVelocity.set(...(rotate ? angularVelocity : [0, 0, 0]))
  }, [angularVelocity, api, rotate])

  return null
}
