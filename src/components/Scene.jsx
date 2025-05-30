// import Box from './Box'
import Ground from './Ground'
// import CylinderPlatform from './CylinderPlatform'
// import Conveyor from './Conveyor'
import { layoutData } from '../data/layoutData.js'
import ConveyorWithPhysics from './ConveyorWithPhysics'

export default function Scene({ rotate ,roller_rolling_deg_Z}) {

  //  console.log('Scene rotate:', rotate)
  
  return (
    <>

      <Ground />

      {layoutData.conveyors.map((c) => {
        // console.log('Conveyor position:', c.position, 'rotation:', c.rotation)
        return (
          <ConveyorWithPhysics
            key={c.id}
            position={c.position}
            rotation={c.rotation}
            rotate={rotate}
            roller_rolling_deg_Z = {roller_rolling_deg_Z}
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
