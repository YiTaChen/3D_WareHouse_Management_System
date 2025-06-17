// import Box from './Box'
import Ground from './Ground'
// import CylinderPlatform from './CylinderPlatform'
// import Conveyor from './Conveyor'
import { useGLTF } from '@react-three/drei';
import { layoutData } from '../data/layoutData.js'
import ConveyorWithPhysics from './ConveyorWithPhysics'

import { useConveyorStore } from '../stores/conveyorStore.js'
import ShelfData from '../data/ShelfData'; 
import Shelf from './Shelf';
import Crane from './Crane'; // 引入 Crane 組件
import CraneData from '../data/CraneData'; // 引入 Crane 資料


export default function Scene() {

  //  console.log('Scene rotate:', rotate)

  // const gltf = useGLTF('/models/conveyor_scene.glb'); // Load your entire scene GLTF

  // const { scene } = useGLTF('/plateform_conveyor_ver5.gltf') // add lasor sensor and light bulb
  

  const { rotate, rollerSpeed } = useConveyorStore();

  return (
    <>

      <Ground />

      {layoutData.conveyors.map((c) => {
        // console.log('Conveyor position:', c.position, 'rotation:', c.rotation)
        return (
          <ConveyorWithPhysics
            key={c.id}
            id={c.id}
            position={c.position}
            rotation={c.rotation}
            // rotate={rotate}
            // roller_rolling_deg_Z = {rollerSpeed} // 傳遞滾筒速度
          />
        )
      })}

      {/* {boxes.map((b) => (
        <Box key={b.id} position={[1, 3, 1]} />
      ))}
      {/* <CylinderPlatform rotate={rotate} position={[0, 0.5, 0]} />
      <CylinderPlatform rotate={rotate} position={[1, 0.5, 0]} /> */}

        {/* {layoutData.conveyors.map(c => (
          <Conveyor key={c.id} position={c.position} rotation={c.rotation} rotate={rotate} />
        ))} */} 


      {ShelfData.shelves.map((s) => (
        <Shelf
          key={s.id}
          id={s.id}
          modelPath=""
          position={s.position}
          rotation={s.rotation}
        />
      ))}



      {CraneData.cranes.map((s) => (
        <Crane
          key={s.id}
          id={s.id}
          modelPath="/Crane_ver1.gltf"
          position={s.position}
          rotation={s.rotation}
        />
      ))}


    </>
  )
}
