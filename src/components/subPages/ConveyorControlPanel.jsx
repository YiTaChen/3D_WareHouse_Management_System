
import React, { useState } from 'react'

import layoutData from '../../data/layoutData'

import { useBoxStore } from '../../stores/boxStore'
import { useConveyorStore } from '../../stores/conveyorStore'


import { useCraneStore } from '../../stores/craneStore.js';

import * as THREE from 'three';



export default function ConveyorControlPanel() {

   const addBox = useBoxStore((state) => state.addBox)
    const boxesData = useBoxStore(state => state.boxesData);
    const { rotate, setRotate, rollerSpeed, setRollerSpeed } = useConveyorStore()
    const { setConveyorRotate, setConveyorSpeed, conveyorStates } = useConveyorStore();
    const [selectedConveyorId, setSelectedConveyorId] = useState(layoutData.conveyors[0]?.id || '');
    const [individualInputValue, setIndividualInputValue] = useState('');
    const currentSelectedConveyorState = conveyorStates[selectedConveyorId] || { rotate: false, speed: -20 };

  
 
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


  return (
     <div
          >     
           {/* <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}> 
            <button onClick={handleAddRandomBox}>Add Box</button>
          </div> */}
         
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
    
            </div>
  );
}





