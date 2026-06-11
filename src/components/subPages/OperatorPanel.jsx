import React, { useEffect, useMemo, useState } from 'react';
import { buildInboundMission, buildOutboundMission } from '../../missions/builders/missionBuilder';
import {
  getInboundPortForShelfZ,
  getInboundShelfZPositions,
  getOutboundPortForShelfZ,
  getPortSpawnPosition,
  portOptionsByDirection,
} from '../../missions/config/portConfigs';
import { useBoxEquipStore } from '../../stores/boxEquipStore';
import { useBoxStore } from '../../stores/boxStore';
import { useMissionStore } from '../../stores/missionStore';
import { useShelfStore } from '../../stores/shelfStore';
import { useUIStore } from '../../stores/uiStore';
import Inventory from './Inventory.jsx';

const createDemoBoxData = (boxId, position) => ({
  id: boxId,
  content: {
    demoItem: {
      id: '00001',
      name: 'Demo Item',
      quantity: 12,
    },
  },
  position,
});

const getShelfZ = (shelfPosition) => shelfPosition?.[2];

const buildUniqueShelfOptions = (shelves) => {
  const seen = new Set();
  return shelves.filter((shelf) => {
    if (!shelf?.id || seen.has(shelf.id)) return false;
    seen.add(shelf.id);
    return true;
  });
};

function InboundDemo() {
  const addBox = useBoxStore((state) => state.addBox);
  const mission = useMissionStore((state) => state.mission);
  const setMission = useMissionStore((state) => state.setMission);
  const getEmptyShelfListByZ = useShelfStore((state) => state.getEmptyShelfListByZ);
  const setHighlightPosition = useUIStore((state) => state.setHighlightPosition);

  const [shelfOptions, setShelfOptions] = useState([]);
  const [selectedShelfId, setSelectedShelfId] = useState('');
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    const inboundShelves = portOptionsByDirection.inbound.flatMap((portId) =>
      getEmptyShelfListByZ(getInboundShelfZPositions(portId)),
    );
    const uniqueShelves = buildUniqueShelfOptions(inboundShelves);
    setShelfOptions(uniqueShelves);

    if (uniqueShelves.length === 0) {
      setSelectedShelfId('');
      return;
    }

    if (!uniqueShelves.some((shelf) => shelf.id === selectedShelfId)) {
      setSelectedShelfId(uniqueShelves[0].id);
    }
  }, [getEmptyShelfListByZ, selectedShelfId]);

  const selectedShelf = shelfOptions.find((shelf) => shelf.id === selectedShelfId);
  const selectedPortId = getInboundPortForShelfZ(getShelfZ(selectedShelf?.position));
  const isRunning = mission?.status === 'running';

  const runInbound = async () => {
    if (!selectedShelf || !selectedPortId || isRunning) return;

    try {
      setStatus('Creating demo box...');
      setHighlightPosition(selectedShelf.position);

      const boxId = `demo-box-${Date.now()}`;
      const boxPosition = getPortSpawnPosition(selectedPortId, 'inbound');
      await addBox(boxId, createDemoBoxData(boxId, boxPosition));

      setStatus('Building inbound mission...');
      const nextMission = buildInboundMission({
        portId: selectedPortId,
        boxId,
        shelfPosition: selectedShelf.position,
      });

      setMission(JSON.parse(JSON.stringify(nextMission)));
      setStatus('Mission running...');
      await useMissionStore.getState().runMission();
      setStatus('Inbound mission completed.');
    } catch (error) {
      console.error('[OperatorPanel] Failed to run inbound mission:', error);
      setStatus(error instanceof Error ? error.message : 'Inbound mission failed.');
    }
  };

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div>
        <h3 style={{ margin: '0 0 6px' }}>Inbound</h3>
        <p style={{ margin: 0, color: '#555' }}>Select a destination shelf. The system will create a demo box at the matching inbound port.</p>
      </div>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Destination Shelf</span>
        <select
          value={selectedShelfId}
          onChange={(event) => {
            setSelectedShelfId(event.target.value);
            const shelf = shelfOptions.find((item) => item.id === event.target.value);
            if (shelf) setHighlightPosition(shelf.position);
          }}
          disabled={shelfOptions.length === 0 || isRunning}
          style={{ padding: '8px', border: '1px solid #bbb', borderRadius: 4 }}
        >
          {shelfOptions.length > 0 ? (
            shelfOptions.map((shelf) => (
              <option key={shelf.id} value={shelf.id}>
                {shelf.id}
              </option>
            ))
          ) : (
            <option value="">No available shelves</option>
          )}
        </select>
      </label>

      <button
        onClick={runInbound}
        disabled={!selectedShelf || !selectedPortId || isRunning}
        style={{ padding: '10px 12px', background: '#1f7a4d', color: 'white', border: 0, borderRadius: 4, cursor: 'pointer' }}
      >
        Run Inbound
      </button>

      <p style={{ margin: 0, color: '#333' }}>Status: {status}</p>
    </section>
  );
}

function OutboundDemo() {
  const mission = useMissionStore((state) => state.mission);
  const setMission = useMissionStore((state) => state.setMission);
  const getAllShelfIds = useBoxEquipStore((state) => state.getAllShelfId);
  const getBoxIdByEquip = useBoxEquipStore((state) => state.getBoxIdbyEquipId);
  const getShelfPosition = useShelfStore((state) => state.getShelfPosition);
  const setHighlightPosition = useUIStore((state) => state.setHighlightPosition);

  const [shelfIds, setShelfIds] = useState([]);
  const [selectedShelfId, setSelectedShelfId] = useState('');
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    const ids = getAllShelfIds();
    setShelfIds(ids);

    if (ids.length === 0) {
      setSelectedShelfId('');
      return;
    }

    if (!ids.includes(selectedShelfId)) {
      setSelectedShelfId(ids[0]);
    }
  }, [getAllShelfIds, selectedShelfId]);

  const selectedShelfPosition = useMemo(
    () => (selectedShelfId ? getShelfPosition(selectedShelfId) : undefined),
    [getShelfPosition, selectedShelfId],
  );
  const selectedPortId = getOutboundPortForShelfZ(getShelfZ(selectedShelfPosition));
  const selectedBoxId = selectedShelfId ? getBoxIdByEquip(selectedShelfId) : null;
  const isRunning = mission?.status === 'running';

  useEffect(() => {
    if (selectedShelfPosition) setHighlightPosition(selectedShelfPosition);
  }, [selectedShelfPosition, setHighlightPosition]);

  const runOutbound = async () => {
    if (!selectedShelfId || !selectedShelfPosition || !selectedPortId || !selectedBoxId || isRunning) return;

    try {
      setStatus('Building outbound mission...');
      setHighlightPosition(selectedShelfPosition);

      const nextMission = buildOutboundMission({
        portId: selectedPortId,
        boxId: selectedBoxId,
        shelfPosition: selectedShelfPosition,
      });

      setMission(JSON.parse(JSON.stringify(nextMission)));
      setStatus('Mission running...');
      await useMissionStore.getState().runMission();
      setStatus('Outbound mission completed.');
    } catch (error) {
      console.error('[OperatorPanel] Failed to run outbound mission:', error);
      setStatus(error instanceof Error ? error.message : 'Outbound mission failed.');
    }
  };

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div>
        <h3 style={{ margin: '0 0 6px' }}>Outbound</h3>
        <p style={{ margin: 0, color: '#555' }}>Choose a shelf with a box. The scene highlights it before outbound starts.</p>
      </div>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Source Shelf</span>
        <select
          value={selectedShelfId}
          onChange={(event) => setSelectedShelfId(event.target.value)}
          disabled={shelfIds.length === 0 || isRunning}
          style={{ padding: '8px', border: '1px solid #bbb', borderRadius: 4 }}
        >
          {shelfIds.length > 0 ? (
            shelfIds.map((shelfId) => (
              <option key={shelfId} value={shelfId}>
                {shelfId}
              </option>
            ))
          ) : (
            <option value="">No occupied shelves</option>
          )}
        </select>
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => selectedShelfPosition && setHighlightPosition(selectedShelfPosition)}
          disabled={!selectedShelfPosition}
          style={{ padding: '10px 12px', background: '#f0f0f0', border: '1px solid #bbb', borderRadius: 4, cursor: 'pointer' }}
        >
          Highlight Shelf
        </button>
        <button
          onClick={runOutbound}
          disabled={!selectedShelfId || !selectedShelfPosition || !selectedPortId || !selectedBoxId || isRunning}
          style={{ padding: '10px 12px', background: '#245b9f', color: 'white', border: 0, borderRadius: 4, cursor: 'pointer' }}
        >
          Run Outbound
        </button>
      </div>

      <p style={{ margin: 0, color: '#333' }}>Status: {status}</p>
    </section>
  );
}

function InventoryDemo() {
  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <div>
        <h3 style={{ margin: '0 0 6px' }}>Inventory</h3>
        <p style={{ margin: 0, color: '#555' }}>Review stored boxes and highlight their current scene position.</p>
      </div>
      <Inventory />
    </section>
  );
}

export default function OperatorPanel() {
  const [activeTab, setActiveTab] = useState('inbound');

  const tabs = [
    { id: 'inbound', label: 'Inbound' },
    { id: 'outbound', label: 'Outbound' },
    { id: 'inventory', label: 'Inventory' },
  ];

  return (
    <div style={{ padding: 16, background: '#f7f7f7' }}>
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #ccc', marginBottom: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 0,
              borderBottom: activeTab === tab.id ? '3px solid #1f6feb' : '3px solid transparent',
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#1f4e8c' : '#333',
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inbound' && <InboundDemo />}
      {activeTab === 'outbound' && <OutboundDemo />}
      {activeTab === 'inventory' && <InventoryDemo />}
    </div>
  );
}
