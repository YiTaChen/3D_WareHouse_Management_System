import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { useBoxStore } from '../../stores/boxStore';
import { useBoxEquipStore } from '../../stores/boxEquipStore';

import { useShelfStore } from '../../stores/shelfStore'; // 假設你有一個工具函數來獲取貨架位置
import { buildInboundMission, buildOutboundMission } from '../../missions/builders/missionBuilder';
import {
  getInboundShelfZPositions,
  getPortConveyorId,
  getPortSpawnPosition,
  portOptionsByDirection,
} from '../../missions/config/portConfigs';




const MissionPanel = () => {
  const mission = useMissionStore((s) => s.mission);
  const setMission = useMissionStore((s) => s.setMission);
  const runMission = useMissionStore((s) => s.runMission);

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



     const addSingleBoxWithData = () => {
        const allContent = {};
        let positionArr = getPortSpawnPosition(selectedPort, selectedDirection);

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

    // 當 Direction 改變時，更新 Port 的選項和預設值
    useEffect(() => {
        const availablePorts = portOptionsByDirection[selectedDirection] || [];
        setSelectedPort(availablePorts[0] || '');
    }, [selectedDirection]);

  // 在 selectedPort 或 getEmptyShelfListByZ 改變時更新 inboundEmptyShelfList for Inbound mission
  useEffect(() => {
      let zPositions = getInboundShelfZPositions(selectedPort);
      const emptyShelves = getEmptyShelfListByZ(zPositions);
      setInboundEmptyShelfList(emptyShelves);

      // 如果當前選定的 Inbound 貨架不在新列表中，則清空選定
      if (emptyShelves.length > 0 && !emptyShelves.some(shelf => shelf.id === selectedInboundShelfId)) {
        setSelectedInboundShelfId(emptyShelves[0].id); // 預設選擇新列表的第一個
      } else if (emptyShelves.length === 0) {
        setSelectedInboundShelfId(''); // 如果列表為空，則清空選定
      }
  }, [selectedPort, getEmptyShelfListByZ]); // 這裡需要依賴 getEmptyShelfListByZ




  const getBoxIdByEquip = useBoxEquipStore((state) => state.getBoxIdbyEquipId);

  const loadInboundMission = (portId) => {
    const mission = buildInboundMission({
      portId,
      boxId: getBoxIdByEquip(getPortConveyorId(portId)),
      shelfPosition: getShelfPosition(selectedInboundShelfId),
    });

    setMission(JSON.parse(JSON.stringify(mission)));
  };

  const loadOutboundMission = (portId) => {
    const mission = buildOutboundMission({
      portId,
      boxId: getBoxIdByEquip(selectedShelfId),
      shelfPosition: getShelfPosition(selectedShelfId),
    });

    setMission(JSON.parse(JSON.stringify(mission)));
  };



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
            {portOptionsByDirection[selectedDirection]?.map(port => (
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

             <button onClick={() => loadInboundMission('Port1')}> Load Mission at Port1  </button>


      <button onClick={() => loadInboundMission('Port3')}> Load Mission at Port3  </button>


      <button onClick={() => loadInboundMission('Port4')}> Load Mission at Port4  </button>

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


  <button onClick={() => loadOutboundMission('Port2')}> Load Mission outBound to Port2   </button>


      <button onClick={() => loadOutboundMission('Port3')}> Load Mission outBound to Port3  </button>


      <button onClick={() => loadOutboundMission('Port5')}> Load Mission outBound to Port5  </button>
    

    
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
