import React, { use, useState } from 'react'; // Added useState for targetBoxId input\
import { useObjectBinding } from '../hooks/useObjectBinding';
import { useCraneStore } from '../stores/craneStore'; // To get craneIds
import { useBoxStore } from '../stores/boxStore'; // To get boxesData


export default function SubPanel() { // Removed ref props
  const craneId = 'crane001'; // The Crane ID you want to control

  // Use useObjectBinding Hook
  const { bindObject, unbindObject, isCraneBound } = useObjectBinding(craneId);

  // Get list of available box IDs from the store
  const availableBoxIds = Object.keys(useBoxStore(state => state.boxesData));
  const [selectedBoxId, setSelectedBoxId] = useState(availableBoxIds[0] || ''); // State for dropdown

  // You can select any crane from CraneData if needed
  const craneIds = Object.keys(useCraneStore(state => state.craneStates));
  const [selectedCraneId, setSelectedCraneId] = useState(craneIds[0] || ''); // State for crane dropdown

  const handleBind = () => {
    if (selectedCraneId && selectedBoxId) {
      bindObject(selectedBoxId); // Pass only the ID. Hook will fetch refs.
    } else {
      console.warn("Please select both a Crane and a Box to bind.");
    }
  };

  const handleUnbind = () => {
    if (selectedCraneId && selectedBoxId) {
      unbindObject(selectedBoxId); // Pass only the ID. Hook will fetch refs.
    } else {
      console.warn("Please select both a Crane and a Box to unbind.");
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '20px',
      transform: 'translateY(-50%)',
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.8)',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }}>
      
      <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
        <h3>Panel 3: Object Binding</h3>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="select-crane">Select Crane: </label>
          <select id="select-crane" value={selectedCraneId} onChange={(e) => setSelectedCraneId(e.target.value)}>
            {craneIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="select-box">Select Box: </label>
          <select id="select-box" value={selectedBoxId} onChange={(e) => setSelectedBoxId(e.target.value)}>
            {availableBoxIds.length > 0 ? (
              availableBoxIds.map(id => <option key={id} value={id}>{id}</option>)
            ) : (
              <option value="">No Boxes</option>
            )}
          </select>
        </div>
        <button onClick={handleBind} disabled={isCraneBound || !selectedBoxId || !selectedCraneId} style={{ marginRight: '10px' }}>
          {isCraneBound ? `Bound to ${selectedBoxId}` : 'Bind Selected Box'}
        </button>
        <button onClick={handleUnbind} disabled={!isCraneBound || !selectedBoxId || !selectedCraneId}>
          Unbind Selected Box
        </button>
        <p>Crane ({craneId}) is bound: {isCraneBound ? 'Yes' : 'No'}</p>
        {isCraneBound && selectedBoxId && <p>Bound Box ID: {selectedBoxId}</p>}
      </div>
    </div>
  );
}