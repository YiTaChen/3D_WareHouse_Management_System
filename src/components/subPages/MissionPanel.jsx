import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { cranePickupMission, crane001InboundMission , crane002InboundMission, crane003InboundMission
  ,crane001_OutboundMission, crane002_OutboundMission, crane003_OutboundMission, inboundTemplateFunction,
  crane001InboundMissionParamTemplate , crane002InboundMissionParamTemplate, crane003InboundMissionParamTemplate
  ,crane001_OutboundMissionTemplate, crane002_OutboundMissionTemplate, crane003_OutboundMissionTemplate
  ,outboundTemplateFunction

} from '../../missions/craneMissionData';

import { useBoxStore } from '../../stores/boxStore';
import { useCraneStore } from '../../stores/craneStore';
import { useBoxEquipStore } from '../../stores/boxEquipStore';

import { useShelfStore } from '../../stores/shelfStore'; // 假設你有一個工具函數來獲取貨架位置




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


  const getAllShelfIds = useBoxEquipStore((state) => state.getAllShelfId);

    const getShelfPosition = useShelfStore((state) => state.getShelfPosition); // 使用自定義的工具函數來獲取貨架位置

    const getEmptyShelfListByZ = useShelfStore((state) => state.getEmptyShelfListByZ);



   // 新增的 state 來儲存所有有 Box 的 Shelf ID
  const [shelfIds, setShelfIds] = useState([]);
  const [selectedShelfId, setSelectedShelfId] = useState('');

  // for save inbound empty shelf
  const [inboundEmptyShelfList, setInboundEmptyShelfList] = useState([]);
  const [selectedInboundShelfId, setSelectedInboundShelfId] = useState(''); // Inbound 選定的空貨架 ID



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



  

    // 使用 useEffect 來更新 Shelf ID 列表    for outbound mission
  useEffect(() => {
    // 獲取當前所有有 Box 的 Shelf ID
    const allShelfIds = getAllShelfIds();
    setShelfIds(allShelfIds);

    // 如果目前沒有選定的 shelf，就預設選擇第一個
    if (allShelfIds.length > 0 && !selectedShelfId) {
      setSelectedShelfId(allShelfIds[0]);
    }
  }, [getAllShelfIds]); // 依賴 getAllShelfIds，當其更新時觸發



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


  // 在 selectedPort 或 getEmptyShelfListByZ 改變時更新 inboundEmptyShelfList for Inbound mission
  useEffect(() => {
      let zPositions = [];
      switch (selectedPort) {
        case 'Port1':
          zPositions = [-8, -4]; // 假設 Port1 對應 Z -8 和 -4
          break;
        case 'Port3':
          zPositions = [-2, 2]; // 假設 Port3 對應 Z -2 和 2
          break;
        case 'Port4':
          zPositions = [4]; // 假設 Port4 對應 Z 4
          break;
        default:
          zPositions = [];
      }
      const emptyShelves = getEmptyShelfListByZ(zPositions);
      setInboundEmptyShelfList(emptyShelves);

      // 如果當前選定的 Inbound 貨架不在新列表中，則清空選定
      if (emptyShelves.length > 0 && !emptyShelves.some(shelf => shelf.id === selectedInboundShelfId)) {
        setSelectedInboundShelfId(emptyShelves[0].id); // 預設選擇新列表的第一個
      } else if (emptyShelves.length === 0) {
        setSelectedInboundShelfId(''); // 如果列表為空，則清空選定
      }
  }, [selectedPort, getEmptyShelfListByZ]); // 這裡需要依賴 getEmptyShelfListByZ




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





    const getPortConveyorName = (portName) => {

       switch (portName) {
          case 'Port1':
            return 'conv1';

          case 'Port2':
            return 'conv4';
        
          case 'Port3':
            return 'conv7';
          case 'Port4':
            return 'conv10';
        
          case 'Port5':
            return 'conv19';
          
            default:
              return ''; // 預設值
        
       }

  };


  const getBoxIdByEquip = useBoxEquipStore((state) => state.getBoxIdbyEquipId);


    const customMission01_in = () => {

      // crane001InboundMissionParamTemplate.boxId = selectedBoxId;
      

      // const equipName = getPortConveyorName('Port1'); 
      // const boxid11 = getEquipmentForBox(equipName);

      // console.log('boxid11', boxid11);
      // console.log('getPortConveyorName', equipName);

      crane001InboundMissionParamTemplate.boxId = getBoxIdByEquip(getPortConveyorName('Port1'));


      crane001InboundMissionParamTemplate.shelfPosition = getShelfPosition(selectedInboundShelfId);

      // console.log('boxId', selectedBoxId);
      const jsonStr =  inboundTemplateFunction(crane001InboundMissionParamTemplate)
      return jsonStr
    }

    const customMission02_in = () => {
      crane002InboundMissionParamTemplate.boxId = getBoxIdByEquip(getPortConveyorName('Port3'));
      crane002InboundMissionParamTemplate.shelfPosition = getShelfPosition(selectedInboundShelfId);
      const jsonStr =  inboundTemplateFunction(crane002InboundMissionParamTemplate)
      return jsonStr
    };

    const customMission03_in = () => {
      crane003InboundMissionParamTemplate.boxId = getBoxIdByEquip(getPortConveyorName('Port4'));
      crane003InboundMissionParamTemplate.shelfPosition = getShelfPosition(selectedInboundShelfId);
      const jsonStr =  inboundTemplateFunction(crane003InboundMissionParamTemplate)
      return jsonStr
    };


    
    // selectedShelfId

    const customMission01_out = () => {
      // crane001_OutboundMissionTemplate.boxId = selectedBoxId;
      crane001_OutboundMissionTemplate.boxId = getBoxIdByEquip(selectedShelfId);
      // console.log("selectedShelfId: ", selectedShelfId)
      // console.log( "shelf position: " ,getShelfPosition(selectedShelfId))

      crane001_OutboundMissionTemplate.shelfPosition = getShelfPosition(selectedShelfId);

      const jsonStr =  outboundTemplateFunction(crane001_OutboundMissionTemplate)
      return jsonStr
    };

    const customMission02_out = () => {
      crane002_OutboundMissionTemplate.boxId = getBoxIdByEquip(selectedShelfId);
      crane002_OutboundMissionTemplate.shelfPosition = getShelfPosition(selectedShelfId);
      const jsonStr =  outboundTemplateFunction(crane002_OutboundMissionTemplate)
      return jsonStr
    };

    const customMission03_out = () => {
      crane003_OutboundMissionTemplate.boxId = getBoxIdByEquip(selectedShelfId);
      crane003_OutboundMissionTemplate.shelfPosition = getShelfPosition(selectedShelfId);
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



     {(selectedDirection === 'inbound')? 
     <>
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


            {/* 新增的 Inbound 空貨架列表 */}
          <div style={{ marginBottom: 10 }}>
            <label>
              Select Inbound Shelf:&nbsp;
              <select
                value={selectedInboundShelfId}
                onChange={e => setSelectedInboundShelfId(e.target.value)}
              >
                {inboundEmptyShelfList.length > 0 ? (
                  inboundEmptyShelfList.map(shelf => (
                    <option key={shelf.id} value={shelf.id}>
                      {shelf.id}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No empty shelves for this port</option>
                )}
              </select>
            </label>
          </div>

      <button onClick={addSingleBoxWithData}>Add Box at Select Port</button>
      </> 
      : <>
        <div style={{ marginBottom: 10 }}>
        <label>
          Select Shelf:&nbsp;
          <select
            value={selectedShelfId}
            onChange={e => setSelectedShelfId(e.target.value)}
          >
            {shelfIds.length > 0 ? (
              shelfIds.map(id => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))
            ) : (
              <option value="" disabled>No shelves with boxes</option>
            )}
          </select>
        </label>
      </div>
      </>}

      




      



      {/* <div style={{ marginBottom: 10 }}>
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
      </div> */}

      {/* <div style={{ marginBottom: 10 }}>
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
 */}



      <h3>Select One InBound Mission</h3>



        <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    marginBottom: '1rem',
    maxWidth: 800,
  }} >
      {/* <button onClick={() => setMission(JSON.parse(JSON.stringify(cranePickupMission)))}> */}

      {/* <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission22)))}>
     
        Load Mission
      </button>

<br />
<br /> */}

             <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission01_in())))}> Load Mission at Port1  </button>


      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission02_in())))}> Load Mission at Port3  </button>


      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission03_in())))}> Load Mission at Port4  </button>

{/* 
<br />
<br /> */}

{/* 

      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission01_out())))}> Load Mission outBound to Port2   </button>


      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission02_out())))}> Load Mission outBound to Port3  </button>


      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission03_out())))}> Load Mission outBound to Port5  </button>
     */}


     <h4>or Select OutBound Mission</h4>
     </div>
     <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '5px',
    // marginBottom: '0.5rem',
    maxWidth: 800,
  }} >


  <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission01_out())))}> Load Mission outBound to Port2   </button>


      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission02_out())))}> Load Mission outBound to Port3  </button>


      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission03_out())))}> Load Mission outBound to Port5  </button>
    

    
  </div>

<br />
<br />
<h3>Start Selected Mission</h3>
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



