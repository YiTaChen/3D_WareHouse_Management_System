import React, { useEffect, useState } from 'react';
import { buildInboundMission, buildOutboundMission } from '../../missions/builders/missionBuilder';
import {
  getInboundShelfZPositions,
  getPortConveyorId,
  portOptionsByDirection,
} from '../../missions/config/portConfigs';
import { useBoxEquipStore } from '../../stores/boxEquipStore';
import { useMissionStore } from '../../stores/missionStore';
import { useShelfStore } from '../../stores/shelfStore';

function MissionHighLevelPanel() {
  const setMission = useMissionStore((state) => state.setMission);
  const runMission = useMissionStore((state) => state.runMission);
  const mission = useMissionStore((state) => state.mission);

  const getAllShelfIds = useBoxEquipStore((state) => state.getAllShelfId);
  const getBoxIdByEquip = useBoxEquipStore((state) => state.getBoxIdbyEquipId);
  const getShelfPosition = useShelfStore((state) => state.getShelfPosition);
  const getEmptyShelfListByZ = useShelfStore((state) => state.getEmptyShelfListByZ);

  const [selectedMissionType, setSelectedMissionType] = useState('inbound');
  const [selectedPortId, setSelectedPortId] = useState(portOptionsByDirection.inbound[0]);
  const [selectedInboundShelfId, setSelectedInboundShelfId] = useState('');
  const [selectedOutboundShelfId, setSelectedOutboundShelfId] = useState('');
  const [inboundEmptyShelves, setInboundEmptyShelves] = useState([]);
  const [outboundShelfIds, setOutboundShelfIds] = useState([]);
  const [missionStatus, setMissionStatus] = useState('');

  useEffect(() => {
    const availablePorts = portOptionsByDirection[selectedMissionType] || [];
    setSelectedPortId(availablePorts[0] || '');
  }, [selectedMissionType]);

  useEffect(() => {
    if (selectedMissionType !== 'inbound') return;

    const emptyShelves = getEmptyShelfListByZ(getInboundShelfZPositions(selectedPortId));
    setInboundEmptyShelves(emptyShelves);

    if (emptyShelves.length === 0) {
      setSelectedInboundShelfId('');
      return;
    }

    if (!emptyShelves.some((shelf) => shelf.id === selectedInboundShelfId)) {
      setSelectedInboundShelfId(emptyShelves[0].id);
    }
  }, [getEmptyShelfListByZ, selectedInboundShelfId, selectedMissionType, selectedPortId]);

  useEffect(() => {
    if (selectedMissionType !== 'outbound') return;

    const shelfIds = getAllShelfIds();
    setOutboundShelfIds(shelfIds);

    if (shelfIds.length === 0) {
      setSelectedOutboundShelfId('');
      return;
    }

    if (!shelfIds.includes(selectedOutboundShelfId)) {
      setSelectedOutboundShelfId(shelfIds[0]);
    }
  }, [getAllShelfIds, selectedMissionType, selectedOutboundShelfId]);

  const buildSelectedMission = () => {
    if (selectedMissionType === 'inbound') {
      return buildInboundMission({
        portId: selectedPortId,
        boxId: getBoxIdByEquip(getPortConveyorId(selectedPortId)),
        shelfPosition: getShelfPosition(selectedInboundShelfId),
      });
    }

    return buildOutboundMission({
      portId: selectedPortId,
      boxId: getBoxIdByEquip(selectedOutboundShelfId),
      shelfPosition: getShelfPosition(selectedOutboundShelfId),
    });
  };

  const startMission = async () => {
    try {
      setMissionStatus('生成任務中...');
      const nextMission = buildSelectedMission();
      setMission(JSON.parse(JSON.stringify(nextMission)));
      setMissionStatus('任務已生成，開始執行...');
      await runMission();
      setMissionStatus('任務執行已送出。');
    } catch (error) {
      console.error('[MissionHighLevelPanel] Failed to run mission:', error);
      setMissionStatus(error instanceof Error ? error.message : '任務生成或執行失敗。');
    }
  };

  const shelfOptions = selectedMissionType === 'inbound'
    ? inboundEmptyShelves.map((shelf) => shelf.id)
    : outboundShelfIds;
  const selectedShelfId = selectedMissionType === 'inbound'
    ? selectedInboundShelfId
    : selectedOutboundShelfId;
  const setSelectedShelfId = selectedMissionType === 'inbound'
    ? setSelectedInboundShelfId
    : setSelectedOutboundShelfId;

  return (
    <div>
      <h2>Mission Control</h2>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>Mission Type:</label>
        <select
          value={selectedMissionType}
          onChange={(event) => setSelectedMissionType(event.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
        >
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>
          {selectedMissionType === 'inbound' ? 'Source Port:' : 'Target Port:'}
        </label>
        <select
          value={selectedPortId}
          onChange={(event) => setSelectedPortId(event.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
        >
          {(portOptionsByDirection[selectedMissionType] || []).map((portId) => (
            <option key={portId} value={portId}>
              {portId}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>
          {selectedMissionType === 'inbound' ? 'Target Shelf:' : 'Source Shelf:'}
        </label>
        <select
          value={selectedShelfId}
          onChange={(event) => setSelectedShelfId(event.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '3px', border: '1px solid #ccc', color: 'black' }}
        >
          {shelfOptions.length > 0 ? (
            shelfOptions.map((shelfId) => (
              <option key={shelfId} value={shelfId}>
                {shelfId}
              </option>
            ))
          ) : (
            <option value="" disabled>No available shelves</option>
          )}
        </select>
      </div>

      <button
        onClick={startMission}
        disabled={!selectedPortId || !selectedShelfId}
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
        Start Mission
      </button>

      <p style={{ marginTop: 15, fontSize: '1.1em' }}>Status: {missionStatus}</p>
      {mission && <p>Current mission: {mission.name} ({mission.status})</p>}
    </div>
  );
}

export default MissionHighLevelPanel;
