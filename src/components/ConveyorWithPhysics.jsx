
import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import RollerCylinder from './RollerCylinder'
import { useConveyorStore } from '../stores/conveyorStore';
import ConveyorExtras from './ConveyorExtras';  

const ROLLER_LOCAL_AXIS = new THREE.Vector3(0, 1, 0);

function getRotatedVector(vector, rotation) {
  const vec = new THREE.Vector3(...vector)
  const euler = new THREE.Euler(...rotation, 'XYZ') // 用 XYZ 順序套用旋轉
  return vec.applyEuler(euler).toArray()
}

// export default function ConveyorWithPhysics({ position, rotation, rotate , roller_rolling_deg_Z }) {
export default function ConveyorWithPhysics({ id, position, rotation}) {


  const { rotate, speed } = useConveyorStore(state => state.getConveyorState(id));


  const { scene } = useGLTF('/plateform_conveyor_ver5.gltf') // add lasor sensor and light bulb

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


  // 從克隆後的場景中提取 InvisibleMaterial, Sensor_1, Sensor_2, Light_bulb_1
  // 我們將這些物件的副本傳遞給 ConveyorExtras
  const extraParts = useMemo(() => {
    const parts = {};
    clonedScene.traverse((obj) => {
      if (obj.name === 'InvisibleBulkSensor' || obj.name === 'Light_bulb_0') {
        parts[obj.name] = obj;
        if (obj.name === 'Light_bulb_0' && obj.material) {
          obj.material = obj.material.clone();
        }
      }
    });
    return parts;
  }, [clonedScene]);


      //  if (rollers.length === 0) {
        
        // 計算原始的尺寸，只需計算一次
        const firstRoller = rollers[0];

        // 1. 取得幾何體
        const geometry = firstRoller.geometry;

        // 2. 如果幾何體還沒有 bounding box，就計算一個
        if (!geometry.boundingBox) {
          geometry.computeBoundingBox();
        }

        // 3. 取得 bounding box 的尺寸
        const size = new THREE.Vector3();
        geometry.boundingBox.getSize(size);

        // 4. 將尺寸應用 roller 的本地 scale
        size.multiply(firstRoller.scale);
        const sizeArray = size.toArray();

        // 5. 計算半徑和長度
        const oriRadius = (sizeArray[0] + sizeArray[2]) / 4;
        const oriLength = sizeArray[1];

  useFrame((_, delta) => {
    if (!rotate) return;

    const rotationStep = speed * delta;
    rollers.forEach((roller) => {
      // The GLTF cylinders are authored along local Y, then pre-rotated into conveyor space.
      roller.rotateOnAxis(ROLLER_LOCAL_AXIS, rotationStep);
    });
  });

        // // 可以在這裡印出原始尺寸來驗證
        // console.log('Original Roller Geometry Size:', sizeArray);
      
        




  return (
    <>
      <primitive object={clonedScene} />
      {rollers.map((roller, i) => {
        const worldPosition = new THREE.Vector3()
        const worldQuaternion = new THREE.Quaternion()

        // console.log('worldquaternion: ', worldQuaternion)
        
        roller.getWorldPosition(worldPosition)
        roller.getWorldQuaternion(worldQuaternion)

        //  const roller_rolling_deg =[0 , 0 , -20 ]
      //  const roller_rolling_deg =[0 , 0 , roller_rolling_deg_Z ]    
         const roller_rolling_deg =[0 , 0 , speed ]  
         const rollerRotateDeg = getRotatedVector(roller_rolling_deg, rotation)
         

          // console.log('woldquaternion: ', worldQuaternion)
        return (
          <RollerCylinder
            key={i}
            rollerPosition={worldPosition.toArray()}
            rotation={worldQuaternion}
            radius={oriRadius}
            length={oriLength}
            angularVelocity={rollerRotateDeg}
            rotate={rotate}
          />
        )
      })}


      {/* add conveyor platform extra things: sensor and light  */}
      <ConveyorExtras
        id={id}
        invisibleMaterialMesh={extraParts.InvisibleBulkSensor}
        lightBulbMesh={extraParts.Light_bulb_0}
      />






    </>
  )
}
