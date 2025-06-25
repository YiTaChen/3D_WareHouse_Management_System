
import React, { useState, useEffect } from 'react';
import { missionTemplates } from '../../missions/missionTaskTemplates';
import { generateMission, executeMission } from '../../stores/missionAdvancedStore';
import { PortData } from '../../data/PortData'; // 導入 PortData 方便選擇
import { ShelfData } from '../../data/ShelfData'; // 確保導入 ShelfData
import { useBoxStore } from '../../stores/boxStore'; // 導入 Box Store

function MissionHighLevelPanel() {

const boxesData = useBoxStore(state => state.boxesData);

  const boxIds = Object.keys(boxesData || {});

  const [selectedBoxId, setSelectedBoxId] = useState(''); // 預設為空，或設定為 boxIds[0] 如果有 Box
  const [selectedPortId, setSelectedPortId] = useState('port1');
  const [selectedShelfId, setSelectedShelfId] = useState('shelf001');
  const [missionStatus, setMissionStatus] = useState('');
  const [selectedMissionType, setSelectedMissionType] = useState('INBOUND_TO_SHELF'); // 預設為入庫

  // 當 boxIds 列表更新時，如果目前沒有選擇的 Box ID，則預設選第一個
  useEffect(() => {
    if (boxIds.length > 0 && !selectedBoxId) {
      setSelectedBoxId(boxIds[0]);
    }
  }, [boxIds, selectedBoxId]);

  const availableInboundPorts = Object.keys(PortData.inboundPorts);
  const availableOutboundPorts = Object.keys(PortData.outboundPorts);
  const availableShelves = ShelfData.shelves.map(s => s.id); // 取得所有貨架 ID

  const startMission = async () => {
    setMissionStatus('生成任務中...');

    let dynamicParams = {};
    if (selectedMissionType === 'INBOUND_TO_SHELF') {
      dynamicParams = {
        boxId: selectedBoxId,
        fromPortId: selectedPortId,
        toShelfId: selectedShelfId,
      };
    } else if (selectedMissionType === 'OUTBOUND_FROM_SHELF') {
      dynamicParams = {
        boxId: selectedBoxId,
        fromShelfId: selectedShelfId, // 出庫時，貨架是來源
        toPortId: selectedPortId,    // 出庫時，Port 是目標
      };
    } else {
      setMissionStatus('請選擇有效的任務類型。');
      return;
    }

    if (!selectedBoxId) {
      setMissionStatus('請選擇一個 Box ID。');
      return;
    }
    if (!selectedPortId) {
      setMissionStatus('請選擇一個 Port。');
      return;
    }
    if (!selectedShelfId) {
      setMissionStatus('請選擇一個 Shelf ID。');
      return;
    }


    const mission = generateMission(selectedMissionType, dynamicParams);

    if (!mission) {
      setMissionStatus('任務生成失敗！請檢查參數或控制台錯誤。');
      return;
    }

    console.log('生成的任務:', mission);
    setMissionStatus('任務已生成，開始執行...');

    const success = await executeMission(mission);
    setMissionStatus(success ? '任務執行成功！' : '任務執行失敗！');
  };

  return (
    <div 
    // style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: 20, borderRadius: 5, zIndex: 1000 }}
    >
      <h2>任務控制面板</h2>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>Box ID:</label>
        <select
          value={selectedBoxId}
          onChange={(e) => setSelectedBoxId(e.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
        >
          {boxIds.length === 0 ? (
            <option value="">無 Box 可選</option>
          ) : (
            boxIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))
          )}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>任務類型:</label>
        <select
          value={selectedMissionType}
          onChange={(e) => {
            setSelectedMissionType(e.target.value);
            // 根據任務類型預設 Port ID
            if (e.target.value === 'INBOUND_TO_SHELF' && availableInboundPorts.length > 0) {
              setSelectedPortId(availableInboundPorts[0]);
            } else if (e.target.value === 'OUTBOUND_FROM_SHELF' && availableOutboundPorts.length > 0) {
              setSelectedPortId(availableOutboundPorts[0]);
            }
          }}
          style={{ width: '100%', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
        >
          <option value="INBOUND_TO_SHELF">入庫 (Port - Shelf)</option>
          <option value="OUTBOUND_FROM_SHELF">出庫 (Shelf - Port)</option>
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>
          {selectedMissionType === 'INBOUND_TO_SHELF' ? '來源埠 (Port):' : '目標埠 (Port):'}
        </label>
        <select
          value={selectedPortId}
          onChange={(e) => setSelectedPortId(e.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
        >
          {(selectedMissionType === 'INBOUND_TO_SHELF' ? availableInboundPorts : availableOutboundPorts).map((id) => (
            <option key={id} value={id}>
              {PortData[selectedMissionType === 'INBOUND_TO_SHELF' ? 'inboundPorts' : 'outboundPorts'][id].name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>
          {selectedMissionType === 'INBOUND_TO_SHELF' ? '目標儲位 (Shelf ID):' : '來源儲位 (Shelf ID):'}
        </label>
        <select
          value={selectedShelfId}
          onChange={(e) => setSelectedShelfId(e.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
        >
          {availableShelves.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={startMission}
        style={{
          marginTop: 10,
          padding: '8px 15px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        啟動任務
      </button>

      <p style={{ marginTop: 15, fontSize: '1.1em' }}>狀態: {missionStatus}</p>
    </div>
  );
}

export default MissionHighLevelPanel;

