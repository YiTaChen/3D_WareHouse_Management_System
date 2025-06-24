
import React, { useState } from 'react';
import { missionTemplates } from '../../missions/missionTaskTemplates';
import { generateMission, executeMission } from '../../stores/missionAdvancedStore';
import { PortData } from '../../data/PortData'; // 導入 PortData 方便選擇

function MissionHighLevelPanel() {
  const [boxIdInput, setBoxIdInput] = useState('box001');
  const [selectedPortId, setSelectedPortId] = useState('port1'); // 選擇 Port
  const [selectedShelfId, setSelectedShelfId] = useState('shelf001'); // 選擇 Shelf
  const [missionStatus, setMissionStatus] = useState('');
  const [missionDirection, setMissionDirection] = useState('inbound'); // 'inbound' 或 'outbound'

  const availableInboundPorts = Object.keys(PortData.inboundPorts);
  const availableOutboundPorts = Object.keys(PortData.outboundPorts);

  const startMission = async () => {
    setMissionStatus('生成任務中...');
    let missionType;
    let dynamicParams;

    if (missionDirection === 'inbound') {
      missionType = 'INBOUND_TO_SHELF';
      dynamicParams = {
        boxId: boxIdInput,
        fromPortId: selectedPortId,
        toShelfId: selectedShelfId,
      };
    } else { // outbound
      missionType = 'OUTBOUND_FROM_SHELF';
      dynamicParams = {
        boxId: boxIdInput,
        fromShelfId: selectedShelfId, // 出庫時，貨架是來源
        toPortId: selectedPortId,    // 出庫時，Port 是目標
      };
    }


    const mission = generateMission(missionType, dynamicParams);

    if (!mission) {
      setMissionStatus('任務生成失敗！');
      return;
    }

    console.log('生成的任務:', mission);
    setMissionStatus('任務已生成，開始執行...');

    const success = await executeMission(mission);
    setMissionStatus(success ? '任務執行成功！' : '任務執行失敗！');
  };

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: 'white', padding: 20, borderRadius: 5 }}>
      <h2>任務控制面板</h2>
      <div>
        <label>Box ID:</label>
        <input type="text" value={boxIdInput} onChange={(e) => setBoxIdInput(e.target.value)} />
      </div>
      <div>
        <label>任務方向:</label>
        <select value={missionDirection} onChange={(e) => setMissionDirection(e.target.value)}>
          <option value="inbound">入庫</option>
          <option value="outbound">出庫</option>
        </select>
      </div>
      <div>
        <label>
          {missionDirection === 'inbound' ? '來源埠 (Port):' : '目標埠 (Port):'}
        </label>
        <select value={selectedPortId} onChange={(e) => setSelectedPortId(e.target.value)}>
          {missionDirection === 'inbound'
            ? availableInboundPorts.map(id => <option key={id} value={id}>{PortData.inboundPorts[id].name}</option>)
            : availableOutboundPorts.map(id => <option key={id} value={id}>{PortData.outboundPorts[id].name}</option>)
          }
        </select>
      </div>
      <div>
        <label>
          {missionDirection === 'inbound' ? '目標儲位 (Shelf ID):' : '來源儲位 (Shelf ID):'}
        </label>
        <input type="text" value={selectedShelfId} onChange={(e) => setSelectedShelfId(e.target.value)} />
      </div>
      <button onClick={startMission} style={{ marginTop: 10, padding: '5px 10px' }}>
        啟動任務
      </button>
      <p>狀態: {missionStatus}</p>
    </div>
  );
}

export default MissionHighLevelPanel;

