// import React, { useState, useEffect } from 'react';
// import { useCraneStore } from '../../stores/craneStore';
// import { useBoxStore } from '../../stores/boxStore';
// import { useBindingStore } from '../../stores/bindingStore';

// export default function ObjectBindingTest() {
//   // Get available IDs
//   const availableBoxIds = Object.keys(useBoxStore(state => state.boxesData));
//   const craneIds = Object.keys(useCraneStore(state => state.craneStates));
  
//   // State for selections
//   const [selectedBoxId, setSelectedBoxId] = useState(availableBoxIds[0] || '');
//   const [selectedCraneId, setSelectedCraneId] = useState(craneIds[0] || '');

//   // Get binding actions from store
//   const bindingActions = useBindingStore(state => 
//     state.getCraneBindingActions?.(selectedCraneId)
//   );
  
//   const { bindObject, unbindObject } = bindingActions || {};
  
//   // Get current binding state
//   const currentCraneBindingState = useBindingStore(state => 
//     state.isCraneBound?.(selectedCraneId) || false
//   );
  
//   const currentBinding = useBindingStore(state => 
//     state.getCraneBinding?.(selectedCraneId)
//   );

//   // Debug info
//   const debugInfo = {
//     hasBindingActions: !!bindingActions,
//     hasBindObject: !!bindObject,
//     hasUnbindObject: !!unbindObject,
//     selectedCraneId,
//     selectedBoxId,
//     currentCraneBindingState,
//     currentBoundObjectId: currentBinding?.boundObjectId
//   };

//   // Handle bind
//   const handleBind = () => {
//     if (!bindObject) {
//       console.warn("Bind function not available. Make sure CraneBindingLogic is rendered.");
//       return;
//     }
    
//     if (!selectedCraneId || !selectedBoxId) {
//       console.warn("Please select both a crane and a box.");
//       return;
//     }
    
//     if (currentCraneBindingState) {
//       console.warn("Crane is already bound to an object.");
//       return;
//     }
    
//     console.log(`Binding box ${selectedBoxId} to crane ${selectedCraneId}`);
//     bindObject(selectedBoxId);
//   };

//   // Handle unbind
//   const handleUnbind = () => {
//     if (!unbindObject) {
//       console.warn("Unbind function not available.");
//       return;
//     }
    
//     if (!currentCraneBindingState) {
//       console.warn("Crane is not bound to any object.");
//       return;
//     }
    
//     console.log(`Unbinding from crane ${selectedCraneId}`);
//     unbindObject(selectedBoxId);
//   };

//   // Reset selectedBoxId if it becomes invalid
//   useEffect(() => {
//     if (selectedBoxId && !availableBoxIds.includes(selectedBoxId)) {
//       setSelectedBoxId(availableBoxIds[0] || '');
//     }
//   }, [availableBoxIds, selectedBoxId]);

//   return (
//     <div style={{
//       padding: '20px',
//       borderRadius: '8px',
//       boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
//       display: 'flex',
//       flexDirection: 'column',
//       gap: '15px'
//     }}>
      
//       <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
//         <h3>Panel 3: Object Binding Control</h3>
        
//         {/* Crane Selection */}
//         <div style={{ marginBottom: '10px' }}>
//           <label htmlFor="select-crane">Select Crane: </label>
//           <select 
//             id="select-crane" 
//             value={selectedCraneId} 
//             onChange={(e) => setSelectedCraneId(e.target.value)}
//             style={{ padding: '5px', marginLeft: '10px' }}
//           >
//             {craneIds.map(id => (
//               <option key={id} value={id}>{id}</option>
//             ))}
//           </select>
//         </div>

//         {/* Box Selection */}
//         <div style={{ marginBottom: '10px' }}>
//           <label htmlFor="select-box">Select Box: </label>
//           <select 
//             id="select-box" 
//             value={selectedBoxId} 
//             onChange={(e) => setSelectedBoxId(e.target.value)}
//             style={{ padding: '5px', marginLeft: '10px' }}
//           >
//             {availableBoxIds.length > 0 ? (
//               availableBoxIds.map(id => (
//                 <option key={id} value={id}>{id}</option>
//               ))
//             ) : (
//               <option value="">No Boxes Available</option>
//             )}
//           </select>
//         </div>

//         {/* Control Buttons */}
//         <div style={{ marginBottom: '15px' }}>
//           <button
//             onClick={handleBind}
//             disabled={!bindObject || currentCraneBindingState || !selectedBoxId || !selectedCraneId}
//             style={{ 
//               marginRight: '10px', 
//               padding: '8px 16px',
//               backgroundColor: currentCraneBindingState ? '#ccc' : '#4CAF50',
//               color: 'white',
//               border: 'none',
//               borderRadius: '4px',
//               cursor: !bindObject || currentCraneBindingState ? 'not-allowed' : 'pointer'
//             }}
//           >
//             {currentCraneBindingState ? `Bound to ${currentBinding?.boundObjectId}` : 'Bind Selected Box'}
//           </button>
          
//           <button
//             onClick={handleUnbind}
//             disabled={!unbindObject || !currentCraneBindingState || !selectedBoxId || !selectedCraneId}
//             style={{ 
//               padding: '8px 16px',
//               backgroundColor: !currentCraneBindingState ? '#ccc' : '#f44336',
//               color: 'white',
//               border: 'none',
//               borderRadius: '4px',
//               cursor: !unbindObject || !currentCraneBindingState ? 'not-allowed' : 'pointer'
//             }}
//           >
//             Unbind Selected Box
//           </button>
//         </div>

//         {/* Status Display */}
//         <div style={{ 
//           backgroundColor: '#f5f5f5', 
//           padding: '10px', 
//           borderRadius: '4px',
//           fontSize: '14px'
//         }}>
//           <p><strong>Status:</strong></p>
//           <p>Crane ({selectedCraneId}) is bound: {currentCraneBindingState ? 'Yes' : 'No'}</p>
//           {currentCraneBindingState && currentBinding && (
//             <p>Bound to Box: {currentBinding.boundObjectId}</p>
//           )}
//           {!availableBoxIds.length && (
//             <p style={{ color: 'orange' }}>⚠️ No boxes available for binding</p>
//           )}
//           {!bindObject && (
//             <p style={{ color: 'red' }}>❌ Binding functions not loaded. Check CraneBindingLogic component.</p>
//           )}
//         </div>

//         {/* Debug Info (可選，用於開發階段) */}
//         {process.env.NODE_ENV === 'development' && (
//           <details style={{ marginTop: '10px' }}>
//             <summary>Debug Information</summary>
//             <pre style={{ fontSize: '12px', backgroundColor: '#f0f0f0', padding: '5px' }}>
//               {JSON.stringify(debugInfo, null, 2)}
//             </pre>
//           </details>
//         )}
//       </div>
//     </div>
//   );
// }

// import React, { useState, useEffect } from 'react';
// import { useObjectBindingPosition } from '../../hooks/useObjectBindingPosition';
// import { useBoxStore } from '../../stores/boxStore';
// import { useCraneStore } from '../../stores/craneStore';

// export default function ObjectBindingTest() {
//   // 獲取 store 狀態和方法
//   const boxesData = useBoxStore(state => state.boxesData);
//   const getBoxRef = useBoxStore(state => state.getBoxRef);
//   const craneRefs = useCraneStore(state => state.craneRefs);
//   const craneStates = useCraneStore(state => state.craneStates);
//   const getMoveTableRef = useCraneStore(state => state.getMoveTableRef);
  
//   // 取得所有可用的 crane IDs
//   const craneRefsIds = Object.keys(craneRefs || {});
//   const craneStatesIds = Object.keys(craneStates || {});
//   const allCraneIds = [...new Set([...craneRefsIds, ...craneStatesIds])];
  
//   // State for selections
//   const [selectedCraneId, setSelectedCraneId] = useState(allCraneIds[0] || '');
//   const [selectedBoxId, setSelectedBoxId] = useState('');
//   const [diagnostics, setDiagnostics] = useState({});

//   useEffect(() => {
//     if (allCraneIds.length > 0 && !selectedCraneId) {
//       setSelectedCraneId(allCraneIds[0]);
//     }
//   }, [allCraneIds, selectedCraneId]);

//   // 使用位置同步綁定 hook (修正版)
//   const {
//     handleBind,
//     handleUnbind,
//     toggleBinding,
//     isBinding,
//     bindingError,
//     getBindingStatus,
//     updateConfig
//   } = useObjectBindingPosition(selectedCraneId, selectedBoxId);

//   const availableBoxIds = Object.keys(boxesData || {});

//   // 深度診斷函數 (修正版 - 檢查 moveplate)
//   const runDeepDiagnostics = () => {
//     console.log('=== 開始深度診斷 (MoveTable 版本) ===');
    
//     const diagnosticResults = {
//       selectedCraneId,
//       selectedBoxId,
//       timestamp: new Date().toLocaleTimeString()
//     };

//     // 檢查 MoveTable 引用
//     console.log('1. 檢查 MoveTable 引用...');
    
//     let moveTableRef = null;
//     if (getMoveTableRef) {
//       moveTableRef = getMoveTableRef(selectedCraneId);
//       console.log('getMoveTableRef(selectedCraneId):', moveTableRef);
//     }
//     diagnosticResults.moveTableRef = !!moveTableRef;
    
//     // 檢查 moveTable 的各個屬性
//     if (moveTableRef) {
//       diagnosticResults.moveTableHasRefProp = !!(moveTableRef.ref);
//       diagnosticResults.moveTableHasApiProp = !!(moveTableRef.api);
//       diagnosticResults.moveTableRefCurrent = !!(moveTableRef.ref && moveTableRef.ref.current);
      
//       console.log('MoveTable 屬性檢查:', {
//         hasRef: diagnosticResults.moveTableHasRefProp,
//         hasApi: diagnosticResults.moveTableHasApiProp,
//         refCurrent: diagnosticResults.moveTableRefCurrent
//       });
//     }

//     // 檢查 moveTable 的實際物理對象
//     if (moveTableRef?.ref?.current) {
//       try {
//         let moveTablePos;
        
//         // 嘗試不同的位置獲取方法
//         if (typeof moveTableRef.ref.current.translation === 'function') {
//           moveTablePos = moveTableRef.ref.current.translation();
//           diagnosticResults.moveTablePositionMethod = 'translation()';
//         } else if (moveTableRef.ref.current.position) {
//           moveTablePos = moveTableRef.ref.current.position;
//           diagnosticResults.moveTablePositionMethod = 'position';
//         } else {
//           console.warn('無法獲取 MoveTable 位置');
//           diagnosticResults.moveTablePositionMethod = 'none';
//         }
        
//         if (moveTablePos) {
//           console.log('MoveTable 位置:', moveTablePos);
//           diagnosticResults.moveTablePosition = moveTablePos;
//           diagnosticResults.moveTablePhysicsWorking = true;
          
//           // 檢查位置是否為有效數值
//           if (typeof moveTablePos.x === 'number' && typeof moveTablePos.y === 'number' && typeof moveTablePos.z === 'number') {
//             diagnosticResults.moveTablePositionValid = true;
//           } else {
//             diagnosticResults.moveTablePositionValid = false;
//           }
//         }
        
//         // 檢查 moveTable 的身體類型（如果是物理對象）
//         if (typeof moveTableRef.ref.current.bodyType === 'function') {
//           const bodyType = moveTableRef.ref.current.bodyType();
//           console.log('MoveTable body type:', bodyType);
//           diagnosticResults.moveTableBodyType = bodyType;
//         }
        
//       } catch (e) {
//         console.error('MoveTable 物理對象錯誤:', e);
//         diagnosticResults.moveTablePhysicsWorking = false;
//         diagnosticResults.moveTableError = e.message;
//       }
//     }

//     // 檢查 Box 引用 (保持不變)
//     console.log('2. 檢查 Box 引用...');
    
//     let boxRefMethod = null;
//     if (getBoxRef && selectedBoxId) {
//       boxRefMethod = getBoxRef(selectedBoxId);
//       console.log('getBoxRef(selectedBoxId):', boxRefMethod);
//     }
//     diagnosticResults.boxRefMethod = !!boxRefMethod;
    
//     if (boxRefMethod) {
//       diagnosticResults.boxHasRefProp = !!(boxRefMethod.ref);
//       diagnosticResults.boxHasApiProp = !!(boxRefMethod.api);
//       diagnosticResults.boxRefCurrent = !!(boxRefMethod.ref && boxRefMethod.ref.current);
//     }

//     // 檢查 box 的實際物理對象
//     if (boxRefMethod?.ref?.current) {
//       try {
//         let boxPos;
        
//         if (typeof boxRefMethod.ref.current.translation === 'function') {
//           boxPos = boxRefMethod.ref.current.translation();
//           diagnosticResults.boxPositionMethod = 'translation()';
//         } else if (boxRefMethod.ref.current.position) {
//           boxPos = boxRefMethod.ref.current.position;
//           diagnosticResults.boxPositionMethod = 'position';
//         }
        
//         if (boxPos) {
//           console.log('Box 位置:', boxPos);
//           diagnosticResults.boxPosition = boxPos;
//           diagnosticResults.boxPhysicsWorking = true;
          
//           // 檢查 box 的身體類型
//           if (typeof boxRefMethod.ref.current.bodyType === 'function') {
//             const bodyType = boxRefMethod.ref.current.bodyType();
//             console.log('Box body type:', bodyType);
//             diagnosticResults.boxBodyType = bodyType;
//           }
//         }
        
//       } catch (e) {
//         console.error('Box 物理對象錯誤:', e);
//         diagnosticResults.boxPhysicsWorking = false;
//         diagnosticResults.boxError = e.message;
//       }
//     }

//     // 檢查 store 狀態
//     console.log('3. 檢查 Store 狀態...');
//     console.log('boxesData:', boxesData);
//     console.log('craneRefs keys:', Object.keys(craneRefs || {}));
//     console.log('craneStates keys:', Object.keys(craneStates || {}));
    
//     // 檢查綁定條件
//     diagnosticResults.canBindAccordingToHook = 
//       diagnosticResults.moveTableRefCurrent && 
//       diagnosticResults.moveTableRef && 
//       diagnosticResults.boxRefCurrent && 
//       diagnosticResults.boxRefMethod;

//     setDiagnostics(diagnosticResults);
//     console.log('=== 診斷完成 (MoveTable 版本) ===');
//     return diagnosticResults;
//   };

//   // 修正版手動同步 (使用 moveTable)
//   const testManualSyncFixed = () => {
//     console.log('=== 開始修正版手動同步 (MoveTable) ===');
    
//     // 先運行診斷獲取有效的引用
//     const diag = runDeepDiagnostics();
    
//     if (!diag.moveTablePhysicsWorking || !diag.boxPhysicsWorking) {
//       console.error('無法進行手動同步：物理對象無效');
//       return;
//     }

//     // 獲取 moveTable 和 box 引用
//     let moveTableRef = null;
//     let boxRef = null;

//     if (getMoveTableRef && getMoveTableRef(selectedCraneId)?.ref?.current) {
//       moveTableRef = getMoveTableRef(selectedCraneId);
//     }

//     if (getBoxRef && selectedBoxId) {
//       boxRef = getBoxRef(selectedBoxId);
//     }

//     console.log('使用的 moveTableRef:', moveTableRef);
//     console.log('使用的 boxRef:', boxRef);

//     if (moveTableRef?.ref?.current && boxRef?.ref?.current) {
//       try {
//         // 設置 box 為 kinematic 模式
//         if (typeof boxRef.ref.current.setBodyType === 'function') {
//           boxRef.ref.current.setBodyType(2);
//         } else if (boxRef.api) {
//           boxRef.api.mass.set(0);
//         }
        
//         // 獲取 moveTable 位置
//         let moveTablePos;
//         if (typeof moveTableRef.ref.current.translation === 'function') {
//           moveTablePos = moveTableRef.ref.current.translation();
//         } else if (moveTableRef.ref.current.position) {
//           moveTablePos = moveTableRef.ref.current.position;
//         }
        
//         console.log('當前 MoveTable 位置:', moveTablePos);
        
//         // 設置 box 位置（添加垂直偏移）
//         const newBoxPos = {
//           x: moveTablePos.x,
//           y: moveTablePos.y + 1.0, // 1米偏移
//           z: moveTablePos.z
//         };
        
//         // 使用不同方法設置位置
//         if (typeof boxRef.ref.current.setTranslation === 'function') {
//           boxRef.ref.current.setTranslation(newBoxPos, true);
//         } else if (boxRef.api && boxRef.api.position) {
//           boxRef.api.position.set(newBoxPos.x, newBoxPos.y, newBoxPos.z);
//         }
        
//         console.log('設置 Box 新位置:', newBoxPos);
        
//         // 檢查是否成功
//         setTimeout(() => {
//           try {
//             let actualBoxPos;
//             if (typeof boxRef.ref.current.translation === 'function') {
//               actualBoxPos = boxRef.ref.current.translation();
//             } else if (boxRef.ref.current.position) {
//               actualBoxPos = boxRef.ref.current.position;
//             }
//             console.log('設置後的 Box 實際位置:', actualBoxPos);
//           } catch (e) {
//             console.error('檢查位置時出錯:', e);
//           }
//         }, 100);
        
//       } catch (error) {
//         console.error('手動同步過程中發生錯誤:', error);
//       }
//     } else {
//       console.error('無法獲取有效的引用:', { 
//         moveTableRef: !!moveTableRef, 
//         boxRef: !!boxRef 
//       });
//     }
//   };

//   // 測試引用的持續監控 (使用 moveTable)
//   const startReferenceMonitoring = () => {
//     console.log('開始引用監控 (MoveTable)...');
    
//     const monitor = () => {
//       if (selectedCraneId && selectedBoxId) {
//         const moveTableRef = getMoveTableRef?.(selectedCraneId);
//         const boxRef = getBoxRef?.(selectedBoxId);
        
//         if (moveTableRef?.ref?.current && boxRef?.ref?.current) {
//           try {
//             let moveTablePos, boxPos;
            
//             // 獲取 moveTable 位置
//             if (typeof moveTableRef.ref.current.translation === 'function') {
//               moveTablePos = moveTableRef.ref.current.translation();
//             } else if (moveTableRef.ref.current.position) {
//               moveTablePos = moveTableRef.ref.current.position;
//             }
            
//             // 獲取 box 位置
//             if (typeof boxRef.ref.current.translation === 'function') {
//               boxPos = boxRef.ref.current.translation();
//             } else if (boxRef.ref.current.position) {
//               boxPos = boxRef.ref.current.position;
//             }
            
//             console.log(`[${new Date().toLocaleTimeString()}] MoveTable: ${JSON.stringify(moveTablePos)}, Box: ${JSON.stringify(boxPos)}`);
//           } catch (e) {
//             console.error('監控錯誤:', e);
//           }
//         }
//       }
//     };

//     const interval = setInterval(monitor, 2000);
//     setTimeout(() => {
//       clearInterval(interval);
//       console.log('引用監控結束');
//     }, 20000); // 監控20秒
//   };

//   return (
//     <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
//       <h3>修正版 (MoveTable) - 物體綁定測試</h3>
      
//       {/* 診斷結果顯示 */}
//       {Object.keys(diagnostics).length > 0 && (
//         <div style={{ 
//           marginBottom: '15px', 
//           fontSize: '12px', 
//           backgroundColor: '#e7f3ff',
//           padding: '10px',
//           borderRadius: '4px',
//           border: '1px solid #b3d9ff'
//         }}>
//           <h4>診斷結果 ({diagnostics.timestamp})</h4>
//           <div>MoveTable 引用: {diagnostics.moveTableRef ? '✅' : '❌'}</div>
//           <div>MoveTable ref 屬性: {diagnostics.moveTableHasRefProp ? '✅' : '❌'}</div>
//           <div>MoveTable api 屬性: {diagnostics.moveTableHasApiProp ? '✅' : '❌'}</div>
//           <div>MoveTable ref.current: {diagnostics.moveTableRefCurrent ? '✅' : '❌'}</div>
//           <div>MoveTable 物理對象: {diagnostics.moveTablePhysicsWorking ? '✅' : '❌'}</div>
//           {diagnostics.moveTablePositionMethod && (
//             <div>MoveTable 位置方法: {diagnostics.moveTablePositionMethod}</div>
//           )}
//           {diagnostics.moveTableBodyType !== undefined && (
//             <div>MoveTable 身體類型: {diagnostics.moveTableBodyType}</div>
//           )}
          
//           <div>Box 引用: {diagnostics.boxRefMethod ? '✅' : '❌'}</div>
//           <div>Box ref 屬性: {diagnostics.boxHasRefProp ? '✅' : '❌'}</div>
//           <div>Box api 屬性: {diagnostics.boxHasApiProp ? '✅' : '❌'}</div>
//           <div>Box ref.current: {diagnostics.boxRefCurrent ? '✅' : '❌'}</div>
//           <div>Box 物理對象: {diagnostics.boxPhysicsWorking ? '✅' : '❌'}</div>
//           {diagnostics.boxPositionMethod && (
//             <div>Box 位置方法: {diagnostics.boxPositionMethod}</div>
//           )}
//           {diagnostics.boxBodyType !== undefined && (
//             <div>Box 身體類型: {diagnostics.boxBodyType}</div>
//           )}
          
//           <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
//             可以綁定: {diagnostics.canBindAccordingToHook ? '✅' : '❌'}
//           </div>
          
//           {diagnostics.moveTablePosition && (
//             <div>MoveTable 位置: x:{diagnostics.moveTablePosition.x?.toFixed(2)} y:{diagnostics.moveTablePosition.y?.toFixed(2)} z:{diagnostics.moveTablePosition.z?.toFixed(2)}</div>
//           )}
//           {diagnostics.boxPosition && (
//             <div>Box 位置: x:{diagnostics.boxPosition.x?.toFixed(2)} y:{diagnostics.boxPosition.y?.toFixed(2)} z:{diagnostics.boxPosition.z?.toFixed(2)}</div>
//           )}
          
//           {diagnostics.moveTableError && (
//             <div style={{ color: 'red' }}>MoveTable 錯誤: {diagnostics.moveTableError}</div>
//           )}
//           {diagnostics.boxError && (
//             <div style={{ color: 'red' }}>Box 錯誤: {diagnostics.boxError}</div>
//           )}
//         </div>
//       )}

//       {/* 錯誤顯示 */}
//       {bindingError && (
//         <div style={{ 
//           color: 'red', 
//           backgroundColor: '#ffe6e6', 
//           padding: '10px', 
//           borderRadius: '4px',
//           marginBottom: '15px'
//         }}>
//           錯誤: {bindingError}
//         </div>
//       )}
      
//       {/* 狀態顯示 */}
//       <div style={{ 
//         backgroundColor: isBinding ? '#e6ffe6' : '#fff', 
//         padding: '10px', 
//         borderRadius: '4px',
//         marginBottom: '15px'
//       }}>
//         <strong>綁定狀態: </strong>
//         <span style={{ color: isBinding ? 'green' : 'gray' }}>
//           {isBinding ? '已綁定' : '未綁定'}
//         </span>
//       </div>

//       {/* Crane 選擇 */}
//       <div style={{ marginBottom: '15px' }}>
//         <label>選擇 Crane: </label>
//         <select 
//           value={selectedCraneId} 
//           onChange={(e) => setSelectedCraneId(e.target.value)}
//           disabled={isBinding}
//           style={{ padding: '4px 8px', minWidth: '150px' }}
//         >
//           {allCraneIds.map(craneId => (
//             <option key={craneId} value={craneId}>
//               {craneId}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Box 選擇 */}
//       <div style={{ marginBottom: '15px' }}>
//         <label>選擇 Box: </label>
//         <select 
//           value={selectedBoxId} 
//           onChange={(e) => setSelectedBoxId(e.target.value)}
//           disabled={isBinding}
//           style={{ padding: '4px 8px', minWidth: '150px' }}
//         >
//           <option value="">-- 請選擇 Box --</option>
//           {availableBoxIds.map(boxId => (
//             <option key={boxId} value={boxId}>
//               {boxId} ({boxesData[boxId]?.name || 'Unknown'})
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* 診斷按鈕 */}
//       <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
//         <button 
//           onClick={runDeepDiagnostics}
//           style={{
//             padding: '8px 16px',
//             backgroundColor: '#dc3545',
//             color: 'white',
//             border: 'none',
//             borderRadius: '4px'
//           }}
//         >
//           🔍 深度診斷
//         </button>

//         <button 
//           onClick={testManualSyncFixed}
//           disabled={!selectedBoxId || !selectedCraneId}
//           style={{
//             padding: '8px 16px',
//             backgroundColor: '#fd7e14',
//             color: 'white',
//             border: 'none',
//             borderRadius: '4px'
//           }}
//         >
//           🔧 修正版手動同步
//         </button>

//         <button 
//           onClick={startReferenceMonitoring}
//           style={{
//             padding: '8px 16px',
//             backgroundColor: '#6f42c1',
//             color: 'white',
//             border: 'none',
//             borderRadius: '4px'
//           }}
//         >
//           📊 開始監控
//         </button>
//       </div>

//       {/* 原有控制按鈕 */}
//       <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
//         <button onClick={handleBind} disabled={isBinding || !selectedBoxId || !selectedCraneId}>
//           開始綁定
//         </button>
//         <button onClick={handleUnbind} disabled={!isBinding}>
//           解除綁定
//         </button>
//         <button onClick={toggleBinding} disabled={!selectedBoxId || !selectedCraneId}>
//           切換綁定
//         </button>
//         <button onClick={getBindingStatus}>
//           檢查狀態
//         </button>
//       </div>

//       {/* 說明 */}
//       <div style={{ 
//         marginTop: '20px', 
//         fontSize: '14px', 
//         color: '#666',
//         backgroundColor: '#f8f9fa',
//         padding: '10px',
//         borderRadius: '4px'
//       }}>
//         <h4>診斷步驟：</h4>
//         <ol>
//           <li>選擇 Crane 和 Box</li>
//           <li>點擊「🔍 深度診斷」檢查所有引用和物理對象</li>
//           <li>如果診斷顯示引用有效，嘗試「🔧 修正版手動同步」</li>
//           <li>點擊「📊 開始監控」觀察20秒內的位置變化</li>
//           <li>根據結果判斷問題所在</li>
//         </ol>
//       </div>
//     </div>
//   );
// }




import React, { useState, useEffect } from 'react';
import { useObjectBindingPosition } from '../../hooks/useObjectBindingPosition';
import { useBoxStore } from '../../stores/boxStore';
import { useCraneStore } from '../../stores/craneStore';

export default function ObjectBindingTest() {
  const boxesData = useBoxStore(state => state.boxesData);
  const getBoxRef = useBoxStore(state => state.getBoxRef);
  const craneRefs = useCraneStore(state => state.craneRefs);
  const craneStates = useCraneStore(state => state.craneStates);
  const getMoveTableRef = useCraneStore(state => state.getMoveTableRef);

  // 取得所有 Crane ID (合併兩個來源的 key)
  const craneIds = Array.from(
    new Set([
      ...Object.keys(craneRefs || {}),
      ...Object.keys(craneStates || {}),
    ])
  );

  // 取得所有 Box ID
  const boxIds = Object.keys(boxesData || {});

  // 預設選擇第一個 Crane 和 Box
  const [selectedCraneId, setSelectedCraneId] = useState(craneIds[0] || '');
  const [selectedBoxId, setSelectedBoxId] = useState(boxIds[0] || '');

  // 使用你的 hook
  const {
    forceBind,
    handleBind,
    handleUnbind,
    toggleBinding,
    isBinding,
    bindingError,
  } = useObjectBindingPosition(selectedCraneId, selectedBoxId);

  // 簡單的狀態診斷，方便偵錯
  const [diagnostics, setDiagnostics] = useState({});

  const runDiagnostics = () => {
    const moveTableRef = getMoveTableRef?.(selectedCraneId);
    const boxRef = getBoxRef?.(selectedBoxId);

    setDiagnostics({
      moveTableExists: !!moveTableRef,
      moveTableHasRef: !!moveTableRef?.ref,
      moveTableHasApi: !!moveTableRef?.api,
      moveTableRefCurrent: !!moveTableRef?.ref?.current,

      boxExists: !!boxRef,
      boxHasRef: !!boxRef?.ref,
      boxHasApi: !!boxRef?.api,
      boxRefCurrent: !!boxRef?.ref?.current,

      lastChecked: new Date().toLocaleTimeString(),
    });
  };

  useEffect(() => {
    runDiagnostics();
  }, [selectedCraneId, selectedBoxId]);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Object Binding Test</h2>

      <div style={{ marginBottom: 10 }}>
        <label>
          Select Crane:&nbsp;
          <select
            value={selectedCraneId}
            onChange={e => setSelectedCraneId(e.target.value)}
          >
            {craneIds.map(id => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Select Box:&nbsp;
          <select
            value={selectedBoxId}
            onChange={e => setSelectedBoxId(e.target.value)}
          >
            {boxIds.map(id => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 15 }}>
        <button onClick={forceBind} disabled={!selectedCraneId || !selectedBoxId}>
          Bind
        </button>
        &nbsp;
        <button onClick={handleUnbind} disabled={!selectedCraneId || !selectedBoxId}>
          Unbind
        </button>
        &nbsp;
        <button onClick={toggleBinding} disabled={!selectedCraneId || !selectedBoxId}>
          Toggle Bind
        </button>
      </div>

      <div style={{ marginBottom: 15 }}>
        <strong>Binding Status:</strong> {isBinding ? 'Bound' : 'Not Bound'}
      </div>

      {bindingError && (
        <div style={{ color: 'red', marginBottom: 15 }}>
          <strong>Error:</strong> {bindingError}
        </div>
      )}

      <div style={{ border: '1px solid #ccc', padding: 10, borderRadius: 4 }}>
        <h3>Diagnostics</h3>
        <ul>
          <li>MoveTable Exists: {diagnostics.moveTableExists ? 'Yes' : 'No'}</li>
          <li>MoveTable Ref Exists: {diagnostics.moveTableHasRef ? 'Yes' : 'No'}</li>
          <li>MoveTable API Exists: {diagnostics.moveTableHasApi ? 'Yes' : 'No'}</li>
          <li>MoveTable Ref Current: {diagnostics.moveTableRefCurrent ? 'Yes' : 'No'}</li>
          <li>Box Exists: {diagnostics.boxExists ? 'Yes' : 'No'}</li>
          <li>Box Ref Exists: {diagnostics.boxHasRef ? 'Yes' : 'No'}</li>
          <li>Box API Exists: {diagnostics.boxHasApi ? 'Yes' : 'No'}</li>
          <li>Box Ref Current: {diagnostics.boxRefCurrent ? 'Yes' : 'No'}</li>
          <li>Last Checked: {diagnostics.lastChecked || '-'}</li>
        </ul>
      </div>
    </div>
  );
}
