import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import Materials from './components/Materials'
import Box from './components/Box'
import Scene from './components/Scene'
import { useBoxStore } from './stores/boxStore'
import { useCraneStore } from './stores/craneStore'; 
import CraneBindingLogic from './components/CraneBindingLogic';
import BoxBindingUpdater from './components/BoxBindingUpdater';
import SubPanelProduction from './components/SubPanelProduction.jsx';
import { useProductStore } from './stores/productStore';
import { useUIStore } from './stores/uiStore'; 
import HighlightSpot from './components/effect/HighlightSpot'; // 引入高亮元件
import DatabaseSwitcher from './components/DatabaseSwitcher.jsx';
import FrameRateLimiter from './components/FrameRateLimiter.jsx';

const craneIds = Object.keys(useCraneStore.getState().craneStates);

export default function App() {
  const [isLowPowerDevice] = useState(() => (
    window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
  ));
  const boxesData = useBoxStore(state => state.boxesData);
  const fetchBoxesData = useBoxStore(state => state.fetchBoxesData);

  // 從 uiStore 中獲取 highlightPosition
  const highlightPosition = useUIStore(state => state.highlightPosition); 

  // 使用 useEffect 在元件首次渲染時發送 API 請求
    useEffect(() => {
      fetchBoxesData();
    }, [fetchBoxesData]); 



    const fetchProductsAndCategories = useProductStore(state => state.fetchProductsAndCategories);

     // 在組件首次渲染時載入產品資料
      useEffect(() => {
        fetchProductsAndCategories();
      }, [fetchProductsAndCategories]); // 確保只在函式變化時執行（通常只執行一次）


  const [showSubPanel, setShowSubPanel] = useState(false);

  return (
    <div className="app-shell">
      <DatabaseSwitcher />
     

<div className="app-toolbar">
    {showSubPanel? 
      <SubPanelProduction  setShowSubPanel={setShowSubPanel}/> : 
      <button className="app-primary-action" onClick={()=> setShowSubPanel(true)}>Open Control Panel</button>
      } 

</div>
    

      <Canvas
        className="app-canvas"
        camera={{ position: [-35, 22, 24], fov: 35 }}
        dpr={[1, isLowPowerDevice ? 1.25 : 1.5]}
        frameloop="demand"
        gl={{ antialias: !isLowPowerDevice, powerPreference: 'default' }}
        shadows={!isLowPowerDevice}
      >
        <FrameRateLimiter fps={30} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, -5]} intensity={1} castShadow={!isLowPowerDevice} />
        <OrbitControls />
        <Physics
          allowSleep
          broadphase="SAP"
          maxSubSteps={2}
          shouldInvalidate={false}
          stepSize={1 / 30}
        >

          <BoxBindingUpdater craneId="crane001" boxId="box-xxxx" />
          {/* <Debug color="black" scale={1.05}> 啟用物理調試渲染 */}
            <Materials />

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
