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
  

  // 從 conveyorStore 獲取動作和所有輸送帶的狀態
  const { setConveyorRotate, setConveyorSpeed, conveyorStates } = useConveyorStore();

  // 用於選擇要控制的輸送帶 ID
  const [selectedConveyorId, setSelectedConveyorId] = useState(layoutData.conveyors[0]?.id || '');
  // 用於輸入指定輸送帶速度的值
  const [individualInputValue, setIndividualInputValue] = useState('');

  // 獲取目前選擇輸送帶的狀態，用於顯示和輸入框預設值
  const currentSelectedConveyorState = conveyorStates[selectedConveyorId] || { rotate: false, speed: -20 };


  const handleIndividualSpeedUpdate = () => {
    const value = parseFloat(individualInputValue);
    if (!isNaN(value) && selectedConveyorId) {
      setConveyorSpeed(selectedConveyorId, 0 - value); // 更新指定輸送帶的速度
      console.log(`更新輸送帶 ${selectedConveyorId} 的速度為：`, 0 - value);
    } else {
      console.warn('請選擇輸送帶並輸入有效的速度值。');
    }
  };


  const handleIndividualRotateToggle = () => {
    if (selectedConveyorId) {
      const currentRotate = currentSelectedConveyorState.rotate;
      setConveyorRotate(selectedConveyorId, !currentRotate); // 切換指定輸送帶的轉動狀態
      console.log(`切換輸送帶 ${selectedConveyorId} 的滾筒狀態為：`, !currentRotate);
    } else {
      console.warn('請選擇要控制的輸送帶。');
    }
  };



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
         {/* <div>
        <label htmlFor="">Roller Speed: </label>
        <input type="number" id="roller_rolling_deg_Z" placeholder={0-0} step="0.1"
          onChange={(e) => setInputValue(e.target.value)}
      
          className="border px-2 py-1 mx-2"
        />
        <button onClick={handleUpdate}
          className="bg-blue-500 text-white px-3 py-1 rounded"
          >Update Speed</button>
           <div id="firebase">
    <img id="firebase_link" src="/firebase_link.png" alt="firebase_link" />
  </div>
      </div> */}
      </div>
     
            <div>
          <label htmlFor="conveyor-select">Select Conveyor: </label>
          <select
            id="conveyor-select"
            value={selectedConveyorId}
            onChange={(e) => {
              setSelectedConveyorId(e.target.value);
              // 重置輸入框的值，以匹配新選擇輸送帶的當前速度
              setIndividualInputValue(0 - (conveyorStates[e.target.value]?.speed || -20));
            }}
            className="border px-2 py-1 mx-2"
          >
            {layoutData.conveyors.map(conv => (
              <option key={conv.id} value={conv.id}>
                {conv.id}
              </option>
            ))}
          </select>
        </div>

            {selectedConveyorId && ( // 只有在選擇了輸送帶後才顯示控制項
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleIndividualRotateToggle}>
              {currentSelectedConveyorState.rotate ? 'Stop Roller' : 'Activate Roller'} ({selectedConveyorId})
            </button>
            <div style={{ marginTop: '5px' }}>
              <label htmlFor="individual_roller_speed">Roller Speed ({selectedConveyorId}): </label>
              <input
                type="number"
                id="individual_roller_speed"
                placeholder={0 - currentSelectedConveyorState.speed} // 顯示當前速度
                step="0.1"
                value={individualInputValue} // 將輸入框的值與狀態綁定
                onChange={(e) => setIndividualInputValue(e.target.value)}
                className="border px-2 py-1 mx-2"
              />
              <button onClick={handleIndividualSpeedUpdate} className="bg-blue-500 text-white px-3 py-1 rounded">
                Update Speed
              </button>
            </div>
          </div>
        )}


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





