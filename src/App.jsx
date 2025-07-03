import React, { useState, useEffect } from 'react'
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
import SubPanelProduction from './components/SubPanelProduction.jsx';
import { useProductStore } from './stores/productStore';
import { useUIStore } from './stores/uiStore'; 
import HighlightSpot from './components/effect/HighlightSpot'; // 引入高亮元件



export default function App() {
  const addBox = useBoxStore((state) => state.addBox)
  const boxesData = useBoxStore(state => state.boxesData);
  const { rotate, setRotate, rollerSpeed, setRollerSpeed } = useConveyorStore()
  const { setConveyorRotate, setConveyorSpeed, conveyorStates } = useConveyorStore();
  const [selectedConveyorId, setSelectedConveyorId] = useState(layoutData.conveyors[0]?.id || '');
  const [individualInputValue, setIndividualInputValue] = useState('');
  const currentSelectedConveyorState = conveyorStates[selectedConveyorId] || { rotate: false, speed: -20 };
  const setBoxesData = useBoxStore(state => state.setBoxesData); 

  const fetchBoxesData = useBoxStore(state => state.fetchBoxesData);

  // 從 uiStore 中獲取 highlightPosition
  const highlightPosition = useUIStore(state => state.highlightPosition); 

  // const initialBoxesSetup = React.useRef({});
  // const hasInitializedBoxes = React.useRef(false);
  // React.useEffect(() => {
  //   if (!hasInitializedBoxes.current) {
  //     Object.values(initialBoxesSetup.current).forEach(box => {
  //       addBox(box.id, box); 
  //     });
  //     hasInitializedBoxes.current = true;
  //   }
  // }, [addBox]);

  // 使用 useEffect 在元件首次渲染時發送 API 請求
    useEffect(() => {
      fetchBoxesData();
    }, [fetchBoxesData]); 



    const fetchProductsAndCategories = useProductStore(state => state.fetchProductsAndCategories);

     // 在組件首次渲染時載入產品資料
      useEffect(() => {
        fetchProductsAndCategories();
      }, [fetchProductsAndCategories]); // 確保只在函式變化時執行（通常只執行一次）


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

   const [showEngineerSubPanel, setShowEngineerSubPanel] = useState(false);

  const craneIds = Object.keys(useCraneStore(state => state.craneStates));


  return (
    <div style={{ width: '100vw', height: '100vh' }}>
     

<div
  
      >
    {showSubPanel? 
      <SubPanelProduction  setShowSubPanel={setShowSubPanel}/> : 
      <button style={{marginRight: '20px', marginLeft:  '20px' , backgroundColor:'lightgreen' }} onClick={()=> setShowSubPanel(true)}>Show Main Function Panel</button>
      } 
      {showEngineerSubPanel?  
      <SubPanel  setShowEngineerSubPanel={setShowEngineerSubPanel}/> : 
      <button style={{marginRight: '20px', marginLeft:  '20px', backgroundColor:'lightblue' }} onClick={()=> setShowEngineerSubPanel(true)}>Show Engineer Testing Panel</button>
      } 

</div>
    

      <Canvas shadows camera={{ position: [-35, 22, 24], fov: 35 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, -5]} intensity={1} castShadow />
        <OrbitControls />
        <Physics
          // gravity={[0, -9.81, 0]}
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


            {/* HighlightSpot 直接從 uiStore 獲取 highlightPosition */}
             {highlightPosition && <HighlightSpot position={highlightPosition} />}

        </Physics>
      </Canvas>
    </div>
  )
}