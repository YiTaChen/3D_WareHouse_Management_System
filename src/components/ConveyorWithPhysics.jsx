
import React, { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import RollerCylinder from './RollerCylinder'
import { useConveyorStore } from '../stores/conveyorStore';

function getRotatedSize(size, rotation) {
  const euler = new THREE.Euler(...rotation)
  const matrix = new THREE.Matrix4().makeRotationFromEuler(euler)
  const originalSize = new THREE.Vector3(...size)

  // 建立一個 bounding box 並旋轉它，然後取絕對值大小
  const half = originalSize.clone().multiplyScalar(0.5)
  const box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), originalSize)
  box.applyMatrix4(matrix)

  const rotatedSize = new THREE.Vector3()
  box.getSize(rotatedSize)

  return rotatedSize.toArray()
}

function getRotatedVector(vector, rotation) {
  const vec = new THREE.Vector3(...vector)
  const euler = new THREE.Euler(...rotation, 'XYZ') // 用 XYZ 順序套用旋轉
  return vec.applyEuler(euler).toArray()
}

// export default function ConveyorWithPhysics({ position, rotation, rotate , roller_rolling_deg_Z }) {
export default function ConveyorWithPhysics({ id, position, rotation}) {


  const { rotate, speed } = useConveyorStore(state => state.getConveyorState(id));


  const { scene } = useGLTF('/plateform_conveyor_ver3.gltf')

  // console.log('ConveyorWithPhysics position:', position, 'rotation:', rotation, 'rotate:', rotate)



  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.position.set(...position)
    clone.rotation.set(...rotation)
    clone.updateMatrixWorld(true) // ⭐ 關鍵步驟
    return clone
  }, [scene, position, rotation])

  const rollers = useMemo(() => {
    const result = []
    clonedScene.traverse((obj) => {
      if (obj.name.startsWith('Roller_') && obj.geometry) {
        result.push(obj)
      }
    })
    return result
  }, [clonedScene])

  return (
    <>
      <primitive object={clonedScene} />
      {rollers.map((roller, i) => {
        const worldPosition = new THREE.Vector3()
        const worldQuaternion = new THREE.Quaternion()

        // console.log('worldquaternion: ', worldQuaternion)
        
        roller.getWorldPosition(worldPosition)
        roller.getWorldQuaternion(worldQuaternion)

        const size = (() => {
          const bbox = new THREE.Box3().setFromObject(roller)
          const size = new THREE.Vector3()
          bbox.getSize(size)
          return size.multiply(roller.scale)
        })()
        //  console.log('position: ', position)

        // console.log('worldQuaternion: ', worldQuaternion.toArray())

         let sizeArray = size.toArray()
         sizeArray = getRotatedSize(sizeArray, rotation)
         const radius = (sizeArray[0] + sizeArray[1]) / 4
         const length = sizeArray[2]


        //  const roller_rolling_deg =[0 , 0 , -20 ]
      //  const roller_rolling_deg =[0 , 0 , roller_rolling_deg_Z ]    
         const roller_rolling_deg =[0 , 0 , speed ]  
         const rollerRotateDeg = getRotatedVector(roller_rolling_deg, rotation)
         

          // console.log('woldquaternion: ', worldQuaternion)
        return (
          <RollerCylinder
            key={i}
            key11={i}
            equip_position={position}
            roller_position={worldPosition.toArray()}
            rotation={worldQuaternion}
            size={size.toArray()}
            rotate={rotate}
            radius={radius}
            length={length}
            roller_rotate_deg_Array={rollerRotateDeg} // 傳遞旋轉角度陣列
          />
        )
      })}
    </>
  )
}






