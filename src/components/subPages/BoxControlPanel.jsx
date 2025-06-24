// import React, { useState, useEffect } from 'react';
// import { useBoxStore } from '../../stores/boxStore';
// import * as THREE from 'three';

// export default function BoxControlPanel() {
//   const [selectedBoxId, setSelectedBoxId] = useState('');
//  const [isSleeping, setIsSleeping] = useState(null);

//   const boxesData = useBoxStore(state => state.boxesData);
//   const boxRefs = useBoxStore(state => state.boxRefs);
//   const getBoxData = useBoxStore(state => state.getBoxData);
//   const getBoxRef = useBoxStore(state => state.getBoxRef);
//   const updateBoxData = useBoxStore(state => state.updateBoxData);

//   const boxIds = Object.keys(boxesData);
//   const selectedBoxData = selectedBoxId ? getBoxData(selectedBoxId) : null;
//   const selectedBoxRef = selectedBoxId ? getBoxRef(selectedBoxId) : null;


// useEffect(() => {
//     if (!selectedBoxRef?.api?.velocity?.subscribe) {
//       setIsSleeping(null);
//       return;
//     }

//     const unsubscribe = selectedBoxRef.api.velocity.subscribe((v) => {
//       const sleep = v.every(val => Math.abs(val) < 0.001);
//       setIsSleeping(sleep);
//     });

//     return () => unsubscribe?.();
//   }, [selectedBoxId, selectedBoxRef]);

// //   const getWorldPosition = () => {
// //     if (selectedBoxRef?.ref?.current) {
// //       const position = new THREE.Vector3();
// //       selectedBoxRef.ref.current.getWorldPosition(position);
// //       return position.toArray().map(n => n.toFixed(2)).join(', ');
// //     }
// //     return 'N/A';
// //   };

//    const getWorldPosition = () => {
//     if (selectedBoxRef?.ref?.current) {
//       const position = new THREE.Vector3();
//       selectedBoxRef.ref.current.getWorldPosition(position);
//       return position.toArray().map(n => n.toFixed(2)).join(', ');
//     }
//     return 'N/A';
//   };
  

//   const wakeUpBox = () => {
//     if (selectedBoxRef?.api?.wakeUp) {
//       selectedBoxRef.api.wakeUp();
//       console.log(`Box ${selectedBoxId} has been woken up.`);
//     }
//   };

//   const setStaticBox = () => {
//     if (selectedBoxRef?.api) {
//       selectedBoxRef.api.mass.set(0);
//       selectedBoxRef.api.velocity.set(0, 0, 0);
//       selectedBoxRef.api.angularVelocity.set(0, 0, 0);
//       console.log(`Box ${selectedBoxId} set to static.`);
//     }
//   };

//   const setPassiveBox = () => {
//     if (selectedBoxRef?.api) {
//       selectedBoxRef.api.mass.set(1);
//       selectedBoxRef.api.velocity.set(0, 0, 0);
//       selectedBoxRef.api.angularVelocity.set(0, 0, 0);
//       console.log(`Box ${selectedBoxId} set to passive.`);
//     }
//   };

//   const moveBoxUp = () => {
//     if (selectedBoxRef?.api?.position) {
//         // selectedBoxRef.api.velocity.set(0, 0, 0);
//       selectedBoxRef.api.position.set(
//         selectedBoxData.position[0],
//         selectedBoxData.position[1] + 1,
//         selectedBoxData.position[2]
//       );
//       selectedBoxRef.api.wakeUp();
//     }
//   };

//   return (
//     <div style={{ padding: '1rem', background: '#e0f7ff', fontFamily: 'sans-serif' }}>
//       <h3>Box Control Panel</h3>

//       <label>Select Box: </label>
//       <select
//         value={selectedBoxId}
//         onChange={e => setSelectedBoxId(e.target.value)}
//         disabled={boxIds.length === 0}
//       >
//         <option value="">-- Select a Box --</option>
//         {boxIds.map(id => (
//           <option key={id} value={id}>{id}</option>
//         ))}
//       </select>

//       {selectedBoxData && (
//         <div style={{ marginTop: '1rem' }}>
//             <p>Name: {selectedBoxData.name}</p>
//             <p>
//             Content:{' '}
//             {typeof selectedBoxData.content === 'object'
//                 ? JSON.stringify(selectedBoxData.content)
//                 : selectedBoxData.content}
//             </p>
//             <p>Initial Position: {selectedBoxData.position?.join(', ')}</p>
//             <p>World Position: {getWorldPosition()}</p>

//            <p>Sleeping: {isSleeping === null ? 'N/A' : isSleeping ? 'Yes' : 'No'}</p>

//           <div style={{ marginTop: '1rem' }}>
//             <button onClick={wakeUpBox}>Wake Up</button>
//             <button onClick={moveBoxUp} style={{ marginLeft: '0.5rem' }}>Move Up</button>
//             <button onClick={setStaticBox} style={{ marginLeft: '0.5rem' }}>Make Static (展示用)</button>
//             <button onClick={setPassiveBox} style={{ marginLeft: '0.5rem' }}>Make Passive (可滑落)</button>
//           </div>
//         </div>
//         )}

    


//       {!selectedBoxData && selectedBoxId && (
//         <p style={{ marginTop: '1rem', color: 'red' }}>Box not found or not initialized yet.</p>
//       )}

//       {boxIds.length === 0 && (
//         <p style={{ marginTop: '1rem' }}>No boxes available yet. Please add a box.</p>
//       )}
//     </div>
//   );
// }



import React, { useState } from 'react';
import { useBoxStore } from '../../stores/boxStore';
import { useBoxEquipStore } from '../../stores/boxEquipStore';


export default function BoxControlPanel() {
  const [selectedBoxId, setSelectedBoxId] = useState('');

  const boxesData = useBoxStore(state => state.boxesData);
  const getBoxData = useBoxStore(state => state.getBoxData);
  const getBoxSleepStatus = useBoxStore(state => state.getBoxSleepStatus);
  const getBoxWorldPosition = useBoxStore(state => state.getBoxWorldPosition);

  const boxIds = Object.keys(boxesData);
  const selectedBoxData = selectedBoxId ? getBoxData(selectedBoxId) : null;
  const isSleeping = selectedBoxId ? getBoxSleepStatus(selectedBoxId) : null;
  const worldPosition = selectedBoxId ? getBoxWorldPosition(selectedBoxId) : null;
  const getEquipmentForBox = useBoxEquipStore(state => state.getEquipmentForBox);



  const wakeUpBox = () => {
    if (!selectedBoxId) return;
    useBoxStore.getState().wakeUpBox(selectedBoxId);
    };

    const moveBoxUp = () => {
    if (!selectedBoxId) return;
    useBoxStore.getState().moveBoxUp(selectedBoxId, 1);
    };

    const setStaticBox = () => {
    if (!selectedBoxId) return;
    useBoxStore.getState().setStaticBox(selectedBoxId);
    };

    const setPassiveBox = () => {
    if (!selectedBoxId) return;
    useBoxStore.getState().setPassiveBox(selectedBoxId);
    };

    const stopBoxMotion = () => {
    if (!selectedBoxId) return;
    useBoxStore.getState().stopBoxMotion(selectedBoxId);
  };  

    const getBoxType = (boxId) => {
    const boxData = boxesData[boxId];
    if (!boxData) return 'N/A';
    return boxData.boxType || 'unknown';
  };


    const getBoxVelocity = (boxId) => {
      const boxData = boxesData[boxId];
      if (!boxData || !boxData.velocity) return 'N/A';
      return boxData.velocity.map(v => v.toFixed(2)).join(', ');
    };

  const formatArray = (arr) => 
    Array.isArray(arr) ? arr.map(n => n.toFixed(2)).join(', ') : 'N/A';

  const formatContent = (content) => {
    if (content == null) return 'N/A';
    if (typeof content === 'object') {
      try {
        return JSON.stringify(content, null, 2);
      } catch {
        return '[Unable to display content]';
      }
    }
    return String(content);
  };


  const getEquipmentName = (boxId) => {
    const equipment = getEquipmentForBox(boxId);
    // console.log(`Equipment for Box ${boxId}:`, equipment);
    return equipment ? equipment : 'N/A';
  };
  



  return (
    <div style={{ padding: '1rem', background: '#e0f7ff', fontFamily: 'sans-serif' }}>
      <h3>Box Control Panel</h3>

      <label>Select Box: </label>
      <select
        value={selectedBoxId}
        onChange={e => setSelectedBoxId(e.target.value)}
        disabled={boxIds.length === 0}
      >
        <option value="">-- Select a Box --</option>
        {boxIds.map(id => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>

      {selectedBoxData && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Box Data</h4>
          <p>Name: {selectedBoxData.name}</p>
          <p>Content:</p>
          <pre style={{ background: '#f4f4f4', padding: '0.5rem', maxHeight: '200px', overflow: 'auto' }}>
            {formatContent(selectedBoxData.content)}
          </pre>
          <p>Initial Position: {formatArray(selectedBoxData.position)}</p>
          <p>World Position: {formatArray(worldPosition)}</p>
          <p>Sleeping: {isSleeping === null ? 'N/A' : isSleeping ? 'Yes' : 'No'}</p>
          <p>Box Type: {getBoxType(selectedBoxId)}</p>
          <p>Box Velocity: {formatArray(getBoxVelocity(selectedBoxId))}</p>
          <p>Box Equipment: {getEquipmentName(selectedBoxId)}</p>
        </div>

                 
      )}

       <div style={{ marginTop: '1rem' }}>
            <button onClick={wakeUpBox}>Wake Up</button>
            <button onClick={moveBoxUp} style={{ marginLeft: '0.5rem' }}>Move Up</button>
            <button onClick={stopBoxMotion} style={{ marginLeft: '0.5rem' }}>Make Static (展示用)</button>
            <button onClick={setPassiveBox} style={{ marginLeft: '0.5rem' }}>Make Passive (可滑落)</button>
          </div>

      {!selectedBoxData && selectedBoxId && (
        <p style={{ marginTop: '1rem', color: 'red' }}>Box not found or not initialized yet.</p>
      )}

      {boxIds.length === 0 && (
        <p style={{ marginTop: '1rem' }}>No boxes available yet. Please add a box.</p>
      )}
    </div>
  );
}