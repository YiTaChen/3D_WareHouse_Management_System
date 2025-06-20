import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics, Debug } from '@react-three/cannon' 
import ConveyorWithPhysics from './components/ConveyorWithPhysics'
import layoutData from './data/layoutData'
import Ground from './components/Ground'
import Materials from './components/Materials'
import Box from './components/Box'
import Scene from './components/Scene'
import { useBoxStore } from './stores/boxStore'
import { useConveyorStore } from './stores/conveyorStore'
import SubPanel from './components/Subpanel'
import { useCraneStore } from './stores/craneStore'; 
import CraneBindingLogic from './components/CraneBindingLogic';
import BoxBindingUpdater from './components/BoxBindingUpdater';


export default function App() {
  const addBox = useBoxStore((state) => state.addBox)
  const boxesData = useBoxStore(state => state.boxesData);
  const { rotate, setRotate, rollerSpeed, setRollerSpeed } = useConveyorStore()
  const { setConveyorRotate, setConveyorSpeed, conveyorStates } = useConveyorStore();
  const [selectedConveyorId, setSelectedConveyorId] = useState(layoutData.conveyors[0]?.id || '');
  const [individualInputValue, setIndividualInputValue] = useState('');
  const currentSelectedConveyorState = conveyorStates[selectedConveyorId] || { rotate: false, speed: -20 };
  const setBoxesData = useBoxStore(state => state.setBoxesData); 

  const initialBoxesSetup = React.useRef({});
  const hasInitializedBoxes = React.useRef(false);
  React.useEffect(() => {
    if (!hasInitializedBoxes.current) {
      Object.values(initialBoxesSetup.current).forEach(box => {
        addBox(box.id, box); 
      });
      hasInitializedBoxes.current = true;
    }
  }, [addBox]);

  const handleAddRandomBox = () => {
    const newBoxId = `box-${Date.now()}`; 
    const randomName = Math.random() > 0.5 ? 'Special Box' : 'Generic Box';
    const randomContent = Math.random() > 0.5 ? 'Fragile' : 'Durable';
    const newBoxData = {
      id: newBoxId,
      name: randomName,
      content: randomContent,
      position: [0, 4, 0], 
    };
    addBox(newBoxId, newBoxData); 
  };

  const handleIndividualSpeedUpdate = () => {
    const value = parseFloat(individualInputValue);
    if (!isNaN(value) && selectedConveyorId) {
      setConveyorSpeed(selectedConveyorId, 0 - value); 
      console.log(`更新輸送帶 ${selectedConveyorId} 的速度為：`, 0 - value);
    } else {
      console.warn('請選擇輸送帶並輸入有效的速度值。');
    }
  };

  const handleIndividualRotateToggle = () => {
    if (selectedConveyorId) {
      const currentRotate = currentSelectedConveyorState.rotate;
      setConveyorRotate(selectedConveyorId, !currentRotate); 
    } else {
    }
  };

  const handleAllConveyorsIsRotateToggle = () => {
    layoutData.conveyors.forEach(conv => {
      setConveyorRotate(conv.id, true); 
    })
  }

  const handleAllConveyorsNotRotateToggle = () => {
    layoutData.conveyors.forEach(conv => {
      setConveyorRotate(conv.id, false);
    })
  }

  const [inputValue, setInputValue] = useState('')
  
  const handleUpdate = () => {
    const value = parseFloat(inputValue)
    if (!isNaN(value)) {
      setRollerSpeed(0-value)
      setRotate((prev) => !prev) 
    } else {
      setRollerSpeed(-20)
    }
  }

  const [showSubPanel, setShowSubPanel] = useState(false);
  const craneIds = Object.keys(useCraneStore(state => state.craneStates));


  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}> 
        <button onClick={handleAddRandomBox}>Add Box</button>
      </div>
     
          <div>
          <label htmlFor="conveyor-select">Select Conveyor: </label>
          <select
            id="conveyor-select"
            value={selectedConveyorId}
            onChange={(e) => {
              setSelectedConveyorId(e.target.value);
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

            {selectedConveyorId && ( 
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleIndividualRotateToggle}>
              {currentSelectedConveyorState.rotate ? 'Stop Roller' : 'Activate Roller'} ({selectedConveyorId})
            </button>
            <div style={{ marginTop: '5px' }}>
              <label htmlFor="individual_roller_speed">Roller Speed ({selectedConveyorId}): </label>
              <input
                type="number"
                id="individual_roller_speed"
                placeholder={0 - currentSelectedConveyorState.speed} 
                step="0.1"
                value={individualInputValue} 
                onChange={(e) => setIndividualInputValue(e.target.value)}
                className="border px-2 py-1 mx-2"
              />
              <button onClick={handleIndividualSpeedUpdate} className="bg-blue-500 text-white px-3 py-1 rounded">
                Update Speed
              </button>
            </div>

              <div>
                <button onClick={handleAllConveyorsIsRotateToggle} className="bg-green-500 text-white px-3 py-1 rounded mx-2">
                  Activate All Conveyors
                </button>
                <button onClick={handleAllConveyorsNotRotateToggle} className="bg-red-500 text-white px-3 py-1 rounded mx-2">
                  Stop All Conveyors
                </button>
              </div>
          </div>
        )}

      {showSubPanel? 
      <SubPanel  setShowSubPanel={setShowSubPanel}/> : 
      <button onClick={()=> setShowSubPanel(true)}>Show Sub-Panel</button>
      } 

      <Canvas shadows camera={{ position: [0, 10, 20], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <OrbitControls />
        <Physics
          gravity={[0, -9.81, 0]}
          timeStep={1 / 60} // 保留 timeStep 設置，因為它可能對物理穩定性有幫助
        >

          <BoxBindingUpdater craneId="crane001" boxId="box-xxxx" />
          {/* <Debug color="black" scale={1.05}> 啟用物理調試渲染 */}
            <Materials />
            <Ground position={[0, 0, 0]} />

            {Object.values(boxesData).map((box) => (
            <Box
              key={box.id}
              id={box.id}
              initialPosition={box.position} 
            />
            ))} 
          
            <Scene />
            
            {craneIds.map(id => (
              <CraneBindingLogic key={`crane-binding-${id}`} craneId={id} />
            ))}

          {/* </Debug> */}
        </Physics>
      </Canvas>
    </div>
  )
}