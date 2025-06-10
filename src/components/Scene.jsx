// import Box from './Box'
import Ground from './Ground'
// import CylinderPlatform from './CylinderPlatform'
// import Conveyor from './Conveyor'
import { layoutData } from '../data/layoutData.js'
import ConveyorWithPhysics from './ConveyorWithPhysics'

// import { useConveyorStore } from '../stores/conveyorStore.js'



export default function Scene() {

  //  console.log('Scene rotate:', rotate)

  // const { rotate, rollerSpeed } = useConveyorStore();

  return (
    <>

      <Ground />

      {layoutData.conveyors.map((c) => {
        // console.log('Conveyor position:', c.position, 'rotation:', c.rotation)
        return (
          <ConveyorWithPhysics
            key={c.id}
            id={c.id} // conveyor ID
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


    </>
  )
}
