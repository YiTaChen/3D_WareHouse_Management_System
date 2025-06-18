import React, { use, useState, useEffect } from 'react'; // Added useState for targetBoxId input\
import { useObjectBinding } from '../../hooks/useObjectBinding';
import { useCraneStore } from '../../stores/craneStore'; // To get craneIds
import { useBoxStore } from '../../stores/boxStore'; // To get boxesData
import { useBindingStore } from '../../stores/bindingStore';



export default function ObjectBindingTest() { 
  const defaultCraneId = 'crane001'; // The Crane ID you want to control




  // Get list of available box IDs from the store
  const availableBoxIds = Object.keys(useBoxStore(state => state.boxesData));
  const [selectedBoxId, setSelectedBoxId] = useState(availableBoxIds[0] || ''); // State for dropdown

  // You can select any crane from CraneData if needed
  const craneIds = Object.keys(useCraneStore(state => state.craneStates));
  const [selectedCraneId, setSelectedCraneId] = useState(craneIds[0] || defaultCraneId); // State for crane dropdown

  const handleBind = () => {
    if (bindObject && selectedCraneId && selectedBoxId) {
      bindObject(selectedBoxId); // Pass only the ID. Hook will fetch refs.
    } else {
      console.warn("Binding functions not loaded yet, or select both a Crane and a Box.");
    }
  };

  const handleUnbind = () => {
    if (unbindObject && selectedCraneId && selectedBoxId) {
      unbindObject(selectedBoxId); // Pass only the ID. Hook will fetch refs.
    } else {
      console.warn("Unbinding functions not loaded yet, or select both a Crane and a Box.");
    }
  };



// ** it needs to be rendered inside <Canvas> and <Physics> context **
// so use bindingStore to store the bindObject and unbindObject functions
  // Use useObjectBinding Hook
  // const { bindObject, unbindObject, isCraneBound } = useObjectBinding(craneId);
  const { bindObject, unbindObject, isCraneBound } =
    useBindingStore(state => state.getCraneBindingActions(selectedCraneId) || { bindObject: null, unbindObject: null, isCraneBound: false });


  // 辅助 Zustand Selector，直接获取 binding 状态，因为 isCraneBound 是异步更新的
  const currentCraneBindingState = useBindingStore(state => state.isCraneBound(selectedCraneId));

  // 在 availableBoxIds 变化时，如果当前选择的 Box 不再存在，则重置 selectedBoxId
  useEffect(() => {
    if (selectedBoxId && !availableBoxIds.includes(selectedBoxId)) {
      setSelectedBoxId(availableBoxIds[0] || '');
    }
  }, [availableBoxIds, selectedBoxId]);




  return (
    <div style={{
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
        <button
          onClick={handleBind}
          disabled={!bindObject || currentCraneBindingState || !selectedBoxId || !selectedCraneId} // 确保 bindObject 已加载
          style={{ marginRight: '10px' }}
        >
          {currentCraneBindingState ? `Bound to ${selectedBoxId}` : 'Bind Selected Box'}
        </button>
        <button
          onClick={handleUnbind}
          disabled={!unbindObject || !currentCraneBindingState || !selectedBoxId || !selectedCraneId} // 确保 unbindObject 已加载
        >
          Unbind Selected Box
        </button>
        <p>Crane ({selectedCraneId}) is bound: {currentCraneBindingState ? 'Yes' : 'No'}</p>
        {currentCraneBindingState && selectedBoxId && <p>Bound Box ID: {useBindingStore.getState().getCraneBinding(selectedCraneId)?.boundObjectId}</p>}
      </div>
    </div>
  );
}