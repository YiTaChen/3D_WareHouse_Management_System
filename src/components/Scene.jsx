// import Box from './Box'
import Ground from './Ground'
import { layoutData } from '../data/layoutData.js'
import ConveyorWithPhysics from './ConveyorWithPhysics'
import ShelfData from '../data/ShelfData'; 
import Crane from './Crane'; // 引入 Crane 組件
import CraneData from '../data/CraneData'; // 引入 Crane 資料
import { VisualCullingShelfBatch } from './Shelf';


export default function Scene() {
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


      {/* {ShelfData.shelves.map((s) => (
        <Shelf
          key={s.id}
          id={s.id}
          modelPath=""
          position={s.position}
          rotation={s.rotation}
        />
      ))} */}

        {/* <QuickShelfBatch shelves={ShelfData.shelves} /> */}

      {/* <PerformanceShelfBatch shelves={ShelfData.shelves} /> */}

      {/* <ShelfBatch shelves={ShelfData.shelves} /> */}


        <VisualCullingShelfBatch shelves={ShelfData.shelves} />

      {/* <ShelveMultiInstances /> 現在只渲染這一個組件 */}

      {CraneData.cranes.map((s) => (
        <Crane
          key={s.id}
          id={s.id}
          modelPath="/Crane_ver1.gltf"
          // position={s.position}
          rotation={s.rotation}
        />
      ))}


    </>
  )
}
