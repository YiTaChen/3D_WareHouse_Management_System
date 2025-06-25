import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { cranePickupMission, crane001InboundMission , crane002InboundMission, crane003InboundMission
  ,crane001_OutboundMission, crane002_OutboundMission, crane003_OutboundMission, inboundTemplateFunction,
  crane001InboundMissionParamTemplate , crane002InboundMissionParamTemplate, crane003InboundMissionParamTemplate
  ,crane001_OutboundMissionTemplate, crane002_OutboundMissionTemplate, crane003_OutboundMissionTemplate
  ,outboundTemplateFunction

} from '..//../missions/craneMissionData';

import { useBoxStore } from '../../stores/boxStore';
import { useCraneStore } from '../../stores/craneStore';




const MissionPanel = () => {
  const mission = useMissionStore((s) => s.mission);
  const setMission = useMissionStore((s) => s.setMission);
  const runMission = useMissionStore((s) => s.runMission);



  const boxesData = useBoxStore(state => state.boxesData);
    const getBoxRef = useBoxStore(state => state.getBoxRef);
    const craneRefs = useCraneStore(state => state.craneRefs);
    const craneStates = useCraneStore(state => state.craneStates);
    const getMoveTableRef = useCraneStore(state => state.getMoveTableRef);


    const addSingleBox = useBoxStore((state) => state.handleAddSingleBox);

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


 const getPortPosition = (portName, direction) => {


    if (direction === 'inbound' ) {
      
       switch (portName) {
      case 'Port1':
        return [-8, 4, -8];
     
      case 'Port3':
        return [-8, 4, 2];
      case 'Port4':
        return [-8, 4, 8];
      
      default:
        return [0, 0, 0]; // 預設值
    }
  } else {

    switch (portName) {
      
      case 'Port2':
          return [6, 5, -8];
        case 'Port3':
          return [6, 5, 2];
      
        case 'Port5':
          return [6, 5, 4];
        default:
          return [0, 0, 0]; // 預設值
      }

    }
      

   

  };




     const addSingleBoxWithData = () => {
        const allContent = {};
        let positionArr = getPortPosition(selectedPort, selectedDirection);

        const boxData = {
          id: `box-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          content: allContent,
          position: [positionArr[0], positionArr[1], positionArr[2]],
        };
      
        addSingleBox(boxData.id, boxData);
      };
      

    // 新增的 state for Direction 和 Port
    const [selectedDirection, setSelectedDirection] = useState('inbound');
    const [selectedPort, setSelectedPort] = useState('Port1');

    // 定義 Port 的選項
    const portOptions = {
        inbound: ["Port1", "Port3", "Port4"],
        outbound: ["Port2", "Port3", "Port5"]
    };

    // 當 Direction 改變時，更新 Port 的選項和預設值
    useEffect(() => {
        const availablePorts = portOptions[selectedDirection] || [];
        setSelectedPort(availablePorts[0] || '');
    }, [selectedDirection]);


   


  const dynamicSetMission = () => {
    let newMission = null

    let missionTemplate = null;

    if (selectedDirection === 'inbound') {

      switch (selectedPort) {
        case 'Port1':   
          missionTemplate = crane001InboundMissionParamTemplate;
          break;
        case 'Port2':
          missionTemplate = crane002InboundMissionParamTemplate;
          break;
        case 'Port3':
          missionTemplate = crane003InboundMissionParamTemplate;
          break;
        default:
          console.warn('未定義的 Port');
      }
    } else if (selectedDirection === 'outbound') {
      switch (selectedPort) {
        case 'Port2':
          missionTemplate = crane001_OutboundMission;
          break;
        case 'Port3':
          missionTemplate = crane002_OutboundMission;
          break;
          case 'Port5':
            missionTemplate = crane003_OutboundMission;
            break;
          default:
            console.warn('未定義的 Port');
        }







      }




    
    


  }



  const injectMissionParams = (missionTemplate, injectedParams) => {
  const mission = JSON.parse(JSON.stringify(missionTemplate)); // 深拷貝避免污染原始模板

  mission.tasks.forEach((task) => {
      task.steps.forEach((step) => {
        // 如果該 step 有需要被注入的欄位，就替換它
        if (step.params?.craneName && injectedParams.craneName) {
          step.params.craneName = injectedParams.craneName;
        }

        // 可選：針對特定功能替換 targetPosition
        if (
          step.functionKey === 'moveCrane' &&
          injectedParams.targetPositions?.[task.id]
        ) {
          step.params.targetPosition = injectedParams.targetPositions[task.id];
        }


        // 注入 boxId 針對特定步驟或 step id
      // if (
      //   (step.functionKey === 'craneBindingBox' 
      //     || step.functionKey === 'craneUnBindingBox') &&
        
      //   injectedParams.boxIds?.[step.id]
      // ) 
      // {
      //   step.params.boxId = injectedParams.boxIds[step.id];
      // }

      step.params.boxId = injectedParams.boxIds[step.id];


      });
    });

    return mission;
  };



   
  const customMission = injectMissionParams(cranePickupMission, {
      craneName: 'crane001',
      targetPositions: {
        task1: [-4, 0, -10],     // Crane move to port
        task3: [-6, 3, -8],    // Crane move to shelf
      },
      boxIds: {
        step3: selectedBoxId,
      },
    });




    // const customMission01_in = injectMissionParams(crane001InboundMission, {
    //   craneName: 'crane001',

    //   boxIds: {
    //     step3: selectedBoxId,
    //     step6: selectedBoxId,
    //   },
    // });



    const customMission01_in = () => {
      crane001InboundMissionParamTemplate.boxId = selectedBoxId;
      // console.log('boxId', selectedBoxId);
      const jsonStr =  inboundTemplateFunction(crane001InboundMissionParamTemplate)
      return jsonStr
    }

    const customMission02_in = () => {
      crane002InboundMissionParamTemplate.boxId = selectedBoxId;
      const jsonStr =  inboundTemplateFunction(crane002InboundMissionParamTemplate)
      return jsonStr
    };

    const customMission03_in = () => {
      crane003InboundMissionParamTemplate.boxId = selectedBoxId;
      const jsonStr =  inboundTemplateFunction(crane003InboundMissionParamTemplate)
      return jsonStr
    };


    const customMission01_out = () => {
      crane001_OutboundMissionTemplate.boxId = selectedBoxId;
      const jsonStr =  outboundTemplateFunction(crane001_OutboundMissionTemplate)
      return jsonStr
    };

    const customMission02_out = () => {
      crane002_OutboundMissionTemplate.boxId = selectedBoxId;
      const jsonStr =  outboundTemplateFunction(crane002_OutboundMissionTemplate)
      return jsonStr
    };

    const customMission03_out = () => {
      crane003_OutboundMissionTemplate.boxId = selectedBoxId;
      const jsonStr =  outboundTemplateFunction(crane003_OutboundMissionTemplate)
      return jsonStr
    };
  ;

    // const customMission03_out = injectMissionParams(crane003_OutboundMission, {
    //   craneName: 'crane003',

    //   boxIds: {
    //     step3: selectedBoxId,
    //     step6: selectedBoxId,
    //   },
    // });















  return (
    <div style={{ padding: '1rem', background: '#eee', borderRadius: 8 }}>

    <div style={{ marginBottom: 10 }}>
        <label>
          Select Direction:&nbsp;
          <select
            value={selectedDirection}
            onChange={e => setSelectedDirection(e.target.value)}
          >
            <option value="inbound">inbound</option>
            <option value="outbound">outbound</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Select Port:&nbsp;
          <select
            value={selectedPort}
            onChange={e => setSelectedPort(e.target.value)}
          >
            {/* 根據 selectedDirection 動態渲染選項 */}
            {portOptions[selectedDirection]?.map(port => (
              <option key={port} value={port}>
                {port}
              </option>
            ))}
          </select>
        </label>
      </div>


      <button onClick={addSingleBoxWithData}>Add Box</button>

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
      <h3>Mission Control Panel</h3>
      {/* <button onClick={() => setMission(JSON.parse(JSON.stringify(cranePickupMission)))}> */}

      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission22)))}>


      {/* <button onClick={() => dynamicSetMission()}> */}


        
        Load Mission
      </button>

<br />
<br />

             <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission01_in())))}> Load Mission in 01  </button>


      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission02_in())))}> Load Mission in 02  </button>


      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission03_in())))}> Load Mission in 03  </button>


<br />
<br />



      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission01_out())))}> Load Mission out 01  </button>


      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission02_out())))}> Load Mission out 02  </button>


      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission03_out())))}> Load Mission out 03  </button>


<br />
<br />
      <button onClick={runMission} disabled={!mission}>
        Run Mission
      </button>

      {mission && (
        <div style={{ marginTop: '1rem' }}>
          <p>Mission Status：{mission.status}</p>
          {mission.tasks.map((task) => (
            <div key={task.id}>
              <strong>{task.name}（{task.status}）</strong>
              <ul>
                {task.steps.map((step) => (
                  <li key={step.id}>
                    {step.name} - {step.status}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MissionPanel;




// import React, { useState, useEffect } from 'react';
// import { stepFunctions } from '../../missions/stepFunctions';
// import { taskTemplates, stepTemplates } from '../../missions/missionTaskTemplates'; // 確保導入 stepTemplates
// import { useBoxStore } from '../../stores/boxStore';
// import { useCraneStore } from '../../stores/craneStore';
// import { CraneData } from '../../data/CraneData';
// import { ShelfData } from '../../data/ShelfData';
// import { ConveyorData } from '../../data/layoutData';
// import { PortData } from '../../data/PortData';



// // 輔助函數：將字串解析為數字陣列
// const parseNumberArray = (str) => {
//   try {
//     return str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)); // 確保過濾掉非數字
//   } catch (e) {
//     console.error("Error parsing number array:", e);
//     return [];
//   }
// };

// // 輔助函數：根據 functionKey 獲取其預期的參數列表 (用於動態 UI 生成)
// const getStepFunctionParams = (functionKey, allBoxIds, allCraneIds, allConveyorIds) => {
//   // 注意：這裡直接從外部傳入最新的 IDs，確保 options 是即時的
//   const boxOptions = allBoxIds || [];
//   const craneOptions = allCraneIds || [];
//   const conveyorOptions = allConveyorIds || [];

//   switch (functionKey) {
//     case 'moveCrane':
//       return [
//         { name: 'craneName', type: 'select', options: craneOptions, default: craneOptions.length > 0 ? craneOptions[0] : '' },
//         { name: 'targetPosition', type: 'array', placeholder: 'x,y,z (世界座標)', default: [0, 0, 0] }, // 提供一個預設值
//         { name: 'speed', type: 'number', default: 2.0 }
//       ];
//     case 'moveCraneTable':
//       return [
//         { name: 'craneName', type: 'select', options: craneOptions, default: craneOptions.length > 0 ? craneOptions[0] : '' },
//         { name: 'offset', type: 'array', placeholder: 'x,y,z (局部偏移)', default: [0, 0, 0] }, // 提供一個預設值
//         { name: 'speed', type: 'number', default: 1.0 }
//       ];
//     case 'craneBindingBox':
//     case 'craneUnBindingBox':
//       return [
//         { name: 'craneId', type: 'select', options: craneOptions, default: craneOptions.length > 0 ? craneOptions[0] : '' },
//         { name: 'boxId', type: 'select', options: boxOptions, default: boxOptions.length > 0 ? boxOptions[0] : '' }
//       ];
//     case 'moveBoxOnConveyor':
//       return [
//         { name: 'boxId', type: 'select', options: boxOptions, default: boxOptions.length > 0 ? boxOptions[0] : '' },
//         { name: 'conveyorPath', type: 'string', placeholder: 'conv1,conv2,... (Conveyor IDs)', default: '' },
//         { name: 'finalConveyorId', type: 'select', options: conveyorOptions, default: conveyorOptions.length > 0 ? conveyorOptions[0] : '' }
//       ];
//     case 'boxLeaveConveyor':
//     case 'boxArriveOnConveyor':
//       return [
//         { name: 'boxId', type: 'select', options: boxOptions, default: boxOptions.length > 0 ? boxOptions[0] : '' },
//         { name: 'conveyorId', type: 'select', options: conveyorOptions, default: conveyorOptions.length > 0 ? conveyorOptions[0] : '' }
//       ];
//     default:
//       return [];
//   }
// };

// // 輔助函數：獲取 TaskTemplate 的參數
// const getTaskTemplateParams = (templateId, allBoxIds, allCraneIds, allConveyorIds) => {

//     const boxesData = useBoxStore(state => state.boxesData);
    
//       // const boxIds = Object.keys(boxesData || {});
    
//     const boxOptions = Object.keys(boxesData || {});
//     const craneOptions = allCraneIds || [];
//     const conveyorOptions = allConveyorIds || [];

//     switch(templateId) {
//         case 'PICK_FROM_CONVEYOR':
//         case 'PUT_ON_SHELF':
//         case 'PICK_FROM_SHELF':
//         case 'PUT_ON_CONVEYOR':
//             return [
//                 { name: 'craneName', type: 'select', options: craneOptions, default: craneOptions.length > 0 ? craneOptions[0] : '' },
//                 { name: 'boxId', type: 'select', options: boxOptions, default: boxOptions.length > 0 ? boxOptions[0] : '' },
//             ];
//         case 'MOVE_CRANE_TO_TARGET':
//         case 'CRANE_RETURN_HOME':
//             return [
//                 { name: 'craneName', type: 'select', options: craneOptions, default: craneOptions.length > 0 ? craneOptions[0] : '' },
//                 { name: 'targetPosition', type: 'array', placeholder: 'x,y,z (世界座標)', optional: true, default: [0, 0, 0] },
//             ];
//         case 'WAIT_BOX_AT_CRANE_PICKUP':
//         case 'MOVE_BOX_ON_OUTBOUND_CONVEYOR':
//             return [
//                 { name: 'boxId', type: 'select', options: boxOptions, default: boxOptions.length > 0 ? boxOptions[0] : '' },
//                 { name: 'conveyorPath', type: 'string', placeholder: 'conv1,conv2,conv3 (Conveyor IDs)', optional: true, default: '' },
//                 { name: 'finalConveyorId', type: 'select', options: conveyorOptions, optional: true, default: conveyorOptions.length > 0 ? conveyorOptions[0] : '' },
//             ];
//         default:
//             return [];
//     }
// };


// function MissionPanel() {

//   const boxesData = useBoxStore(state => state.boxesData);
    
//       // const boxIds = Object.keys(boxesData || {});
// const allBoxIds = Object.keys(boxesData || {});
//   const allCraneIds = CraneData.cranes.map(c => c.id);
//   const allConveyorIds = ConveyorData.conveyors.map(c => c.id);
//   const allShelfIds = ShelfData.shelves.map(s => s.id);


//   const [executionType, setExecutionType] = useState('step');
//   const [selectedFunctionId, setSelectedFunctionId] = useState('');
//   const [params, setParams] = useState({});
//   const [result, setResult] = useState('');

//   // 確保在 getStepFunctionParams 和 getTaskTemplateParams 中使用最新的 IDs
//   // 透過 useCallback memoize 這些 getter 函數，避免不必要的重新創建
//   const memoizedGetStepFunctionParams = React.useCallback((funcKey) =>
//     getStepFunctionParams(funcKey, allBoxIds, allCraneIds, allConveyorIds),
//     [allBoxIds, allCraneIds, allConveyorIds]
//   );

//   const memoizedGetTaskTemplateParams = React.useCallback((tmplId) =>
//     getTaskTemplateParams(tmplId, allBoxIds, allCraneIds, allConveyorIds),
//     [allBoxIds, allCraneIds, allConveyorIds]
//   );


//   useEffect(() => {
//     setResult(''); // 每次選中功能時重置結果

//     let currentParamDefs = [];
//     if (executionType === 'step' && selectedFunctionId) {
//       currentParamDefs = memoizedGetStepFunctionParams(selectedFunctionId);
//     } else if (executionType === 'task' && selectedFunctionId) {
//       currentParamDefs = memoizedGetTaskTemplateParams(selectedFunctionId);
//     }

//     const newInitialParams = {};
//     currentParamDefs.forEach(p => {
//       // 優先使用當前 state 中的值，如果有效且存在於選項中
//       if (p.type === 'select' && p.options && p.options.length > 0) {
//         if (params[p.name] && p.options.includes(params[p.name])) {
//           newInitialParams[p.name] = params[p.name];
//         } else {
//           newInitialParams[p.name] = p.default !== undefined ? p.default : p.options[0];
//         }
//       } else if (p.default !== undefined) {
//         // 對於有預設值的參數，優先使用預設值
//         newInitialParams[p.name] = params[p.name] !== undefined ? params[p.name] : p.default;
//       } else {
//         // 對於沒有預設值的參數，初始化為空字串或空陣列
//         newInitialParams[p.name] = params[p.name] !== undefined ? params[p.name] : (p.type === 'array' ? [] : '');
//       }
//     });

//     // 檢查新舊參數是否深度相等，避免不必要的狀態更新
//     // 使用 JSON.stringify 是簡潔但有其限制的方式，對於複雜物件可能不準確
//     // 但對於簡單的陣列和基本類型，通常足夠。
//     if (JSON.stringify(newInitialParams) !== JSON.stringify(params)) {
//       setParams(newInitialParams);
//     }

//     // 如果沒有選擇功能，且 params 不為空，則清空 params
//     if (!selectedFunctionId && Object.keys(params).length > 0) {
//       setParams({});
//     }

//   }, [executionType, selectedFunctionId, params,
//       memoizedGetStepFunctionParams, memoizedGetTaskTemplateParams]); // 添加 memoized getter 函數作為依賴


//   const handleParamChange = (name, value, type) => {
//     let parsedValue = value;
//     // if (type === 'number') {
//     //   parsedValue = parseFloat(value);
//     //   if (isNaN(parsedValue) && value !== '') parsedValue = value; // 允許輸入空字串作為暫時輸入
//     // } else if (type === 'array') {
//     //   parsedValue = parseNumberArray(value);
//     // }
//     setParams(prev => ({ ...prev, [name]: parsedValue }));
//   };

//   const executeAction = async () => {
//     setResult('執行中...');
//     let success = false;
//     try {
//       if (executionType === 'step') {
//         const func = stepFunctions[selectedFunctionId];
//         if (func) {
//           success = await func(params);
//         } else {
//           setResult(`錯誤：未找到 stepFunction: ${selectedFunctionId}`);
//           return;
//         }
//       } else { // executionType === 'task'
//         const taskDef = taskTemplates[selectedFunctionId];
//         if (taskDef) {
//             // TaskTemplates 是一個步驟定義的陣列
//             // 這裡我們遍歷並執行每個步驟
//             for (const stepConfig of taskDef) {
//                 const stepTemplate = stepConfig.template; // 這是實際的 stepTemplates 中的定義
//                 const func = stepFunctions[stepTemplate.functionKey];
//                 if (!func) {
//                     setResult(`錯誤：任務中未找到步驟函數: ${stepTemplate.functionKey}`);
//                     return false;
//                 }

//                 // 合併由 DebugPanel 輸入的參數和 stepTemplate 自己的覆寫參數
//                 let currentStepParams = { ...params, ...stepConfig.overrides };

//                 // 特別處理需要從字串解析陣列的參數，例如 conveyorPath 和 targetPosition/offset
//                 if (stepTemplate.functionKey === 'moveBoxOnConveyor' && currentStepParams.conveyorPath) {
//                     currentStepParams.conveyorPath = currentStepParams.conveyorPath.split(',')
//                                                     .map(id => ConveyorData.conveyors.find(c => c.id === id.trim()))
//                                                     .filter(Boolean);
//                 }
//                 if (stepTemplate.functionKey === 'moveCrane' && typeof currentStepParams.targetPosition === 'string') {
//                     currentStepParams.targetPosition = parseNumberArray(currentStepParams.targetPosition);
//                 }
//                 if (stepTemplate.functionKey === 'moveCraneTable' && typeof currentStepParams.offset === 'string') {
//                     currentStepParams.offset = parseNumberArray(currentStepParams.offset);
//                 }


//                 console.log(`[DebugPanel] 執行 Task 中的步驟: ${stepConfig.name} (${stepTemplate.functionKey})`, currentStepParams);
//                 const stepSuccess = await func(currentStepParams);
//                 if (!stepSuccess) {
//                     setResult(`任務步驟 [${stepConfig.name}] 執行失敗！`);
//                     success = false;
//                     return; // 任務失敗則停止執行後續步驟
//                 }
//                 success = true; // 如果單個步驟成功，將成功標誌設置為 true
//             }
//         } else {
//           setResult(`錯誤：未找到 taskTemplate: ${selectedFunctionId}`);
//           return;
//         }
//       }
//       setResult(success ? '執行成功！' : '執行失敗！');
//     } catch (e) {
//       setResult(`執行錯誤：${e.message}`);
//       console.error("執行錯誤:", e);
//     }
//   };

//   const renderParamInput = (paramDef) => {
//     const value = params[paramDef.name] !== undefined
//                   ? (Array.isArray(params[paramDef.name]) ? params[paramDef.name].join(',') : params[paramDef.name])
//                   : (paramDef.default !== undefined ? (Array.isArray(paramDef.default) ? paramDef.default.join(',') : paramDef.default) : '');

//     const id = `param-${paramDef.name}`;

//     if (paramDef.type === 'select') {
//       return (
//         <select
//           id={id}
//           value={value}
//           onChange={(e) => handleParamChange(paramDef.name, e.target.value, paramDef.type)}
//           style={{ width: 'calc(100% - 10px)', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
//         >
//           <option value="">-- 請選擇 --</option>
//           {paramDef.options.map(opt => (
//             <option key={opt} value={opt}>{opt}</option>
//           ))}
//         </select>
//       );
//     } else if (paramDef.type === 'number') {
//       return (
//         <input
//           id={id}
//           type="number"
//           value={value}
//           onChange={(e) => handleParamChange(paramDef.name, e.target.value, paramDef.type)}
//           placeholder={paramDef.placeholder || '' + paramDef.default}
//           style={{ width: 'calc(100% - 10px)', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
//         />
//       );
//     } else if (paramDef.type === 'array' || paramDef.type === 'string') {
//       return (
//         <input
//           id={id}
//           type="text"
//           value={value}
//           onChange={(e) => handleParamChange(paramDef.name, e.target.value, paramDef.type)}
//           placeholder={paramDef.placeholder}
//           style={{ width: 'calc(100% - 10px)', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
//         />
//       );
//     }
//     return null;
//   };

//   const getFunctionParamDefs = () => {
//     if (executionType === 'step' && selectedFunctionId) {
//       return memoizedGetStepFunctionParams(selectedFunctionId);
//     } else if (executionType === 'task' && selectedFunctionId) {
//       return memoizedGetTaskTemplateParams(selectedFunctionId);
//     }
//     return [];
//   };

//   return (
//     <div style={{
//       position: 'absolute',
//       top: 10,
//       right: 10,
//       background: 'rgba(0,0,0,0.7)',
//       color: 'white',
//       padding: 20,
//       borderRadius: 5,
//       zIndex: 1000,
//       width: 300
//     }}>
//       <h2>除錯/測試面板</h2>

//       <div style={{ marginBottom: 15 }}>
//         <label style={{ display: 'block', marginBottom: 5 }}>選擇執行類型:</label>
//         <select
//           value={executionType}
//           onChange={(e) => {
//             setExecutionType(e.target.value);
//             setSelectedFunctionId('');
//           }}
//           style={{ width: '100%', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
//         >
//           <option value="step">單個 StepFunction</option>
//           <option value="task">Task 模板</option>
//         </select>
//       </div>

//       <div style={{ marginBottom: 15 }}>
//         <label style={{ display: 'block', marginBottom: 5 }}>選擇要執行的 {executionType === 'step' ? 'StepFunction' : 'TaskTemplate'}:</label>
//         <select
//           value={selectedFunctionId}
//           onChange={(e) => setSelectedFunctionId(e.target.value)}
//           style={{ width: '100%', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
//         >
//           <option value="">-- 請選擇 --</option>
//           {executionType === 'step' ? (
//             Object.keys(stepFunctions).map(key => (
//               <option key={key} value={key}>{key}</option>
//             ))
//           ) : (
//             Object.keys(taskTemplates).map(key => (
//               <option key={key} value={key}>{key}</option>
//             ))
//           )}
//         </select>
//       </div>

//       {selectedFunctionId && (
//         <div style={{ marginBottom: 15 }}>
//           <h3>參數:</h3>
//           {getFunctionParamDefs().map(paramDef => (
//             <div key={paramDef.name} style={{ marginBottom: 10 }}>
//               <label htmlFor={`param-${paramDef.name}`} style={{ display: 'block', marginBottom: 3 }}>
//                 {paramDef.name} {paramDef.optional ? '(可選)' : ''}:
//               </label>
//               {renderParamInput(paramDef)}
//             </div>
//           ))}
//         </div>
//       )}

//       <button
//         onClick={executeAction}
//         disabled={!selectedFunctionId}
//         style={{
//           marginTop: 10,
//           padding: '8px 15px',
//           backgroundColor: '#007bff',
//           color: 'white',
//           border: 'none',
//           borderRadius: '4px',
//           cursor: 'pointer',
//           fontSize: '16px',
//           width: '100%'
//         }}
//       >
//         執行 {selectedFunctionId || '動作'}
//       </button>

//       <p style={{ marginTop: 15, fontSize: '1.1em' }}>結果: {result}</p>
//     </div>
//   );
// }


// export default MissionPanel;



