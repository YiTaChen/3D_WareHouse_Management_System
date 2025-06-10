// import { Canvas } from '@react-three/fiber'
// import { Physics } from '@react-three/cannon'
// import { OrbitControls } from '@react-three/drei'
// import Scene from './components/Scene'
// import Materials from './components/Materials'
// import { Suspense, useState } from 'react'

// export default function App() {
//   const [boxes, setBoxes] = useState([])
//   const [rotate, setRotate] = useState(false)

//   const addBox = () => setBoxes([...boxes, { id: Date.now() }])
//   const toggleRotate = () => setRotate(!rotate)

//   return (
//     <>
//       <div style={{ position: 'absolute', zIndex: 1, padding: 10 }}>
//         <button onClick={addBox}>新增 Box</button>
//         <button onClick={toggleRotate}>
//           {rotate ? '停止滾筒轉動' : '開始滾筒轉動'}
//         </button>
//       </div>

//       <Canvas
//         shadows
//         style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }}
//         camera={{ position: [0, 5, 10], fov: 50 }}
//       >
//         <ambientLight intensity={0.5} />
//         <directionalLight
//           castShadow
//           position={[10, 10, 5]}
//           intensity={1}
//           shadow-mapSize-width={1024}
//           shadow-mapSize-height={1024}
//         />
//         <Physics gravity={[0, -9.81, 0]}>
//           <Suspense fallback={null}>
//           <Materials />
//           <Scene boxes={boxes} rotate={rotate} />
//           </Suspense>
//         </Physics>
//         <OrbitControls />
//       </Canvas>
//     </>
//   )
// }
// src/App.jsx
import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import ConveyorWithPhysics from './components/ConveyorWithPhysics'
import layoutData from './data/layoutData'
import Ground from './components/Ground'
import Materials from './components/Materials'
import Box from './components/Box'
import Scene from './components/Scene'
import { useBoxStore } from './stores/boxStore'
import { useConveyorStore } from './stores/conveyorStore'



export default function App() {
  // const [boxes, setBoxes] = useState([])

  const boxes = useBoxStore((state) => state.boxes)
  const addBox = useBoxStore((state) => state.addBox)

  // const addBox = () => setBoxes([...boxes, { id: Date.now() }])
  // const [rotate, setRotate] = useState(false)
  // const [rollerSpeed, setRollerSpeed] = useState(-20) // Default speed for the roller

  const { rotate, setRotate, rollerSpeed, setRollerSpeed } = useConveyorStore()


  const [inputValue, setInputValue] = useState('')
  
  const handleUpdate = () => {
    const value = parseFloat(inputValue)
    if (!isNaN(value)) {
      setRollerSpeed(0-value)
      // onUpdate(0-value) // 傳給外部做實際控制邏輯
      // console.log('更新速度為：', 0-value)
      setRotate((prev) => !prev) // 切換滾筒狀態


      // setRotate(!rotate) // 切換滾筒狀態 強制切換？

    } else {
      setRollerSpeed(-20)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
         <button onClick={()=> addBox()}>Add Box</button>
        <button onClick={() => setRotate(!rotate)}>
          {rotate ? 'Stop Roller' : 'Activate Roller'}
          
        </button>
         <div>
        <label htmlFor="">Roller Speed: </label>
        <input type="number" id="roller_rolling_deg_Z" placeholder={0-rollerSpeed} step="0.1"
          onChange={(e) => setInputValue(e.target.value)}
      
          className="border px-2 py-1 mx-2"
        />
        <button onClick={handleUpdate}
          className="bg-blue-500 text-white px-3 py-1 rounded"
          >Update Speed</button>
           {/* <div id="firebase">
    <img id="firebase_link" src="/firebase_link.png" alt="firebase_link" />
  </div> */}
      </div>
      </div>
     

      <Canvas shadows camera={{ position: [0, 10, 20], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <OrbitControls />
        <Physics>
          <Materials />
          <Ground position={[0, 0, 0]} />


           {boxes.map((b) => (
              <Box key={b.id} position={b.position} />
          ))}
          {/* <Scene rotate={rotate} roller_rolling_deg_Z={rollerSpeed}/> */}
          
          <Scene />
          
          {/* {layoutData.conveyors.map((conv) => (
            <ConveyorWithPhysics
              key={conv.id}
              position={conv.position}
              rotation={conv.rotation}
              rotate={rotate}
            />
          ))} */}
        </Physics>
      </Canvas>
    </div>
  )
}





