import { useState } from 'react';
import { API_BASE_URL } from '../../src/config/apiConfig';
import { useBoxStore } from '../../src/stores/boxStore';
import { useMissionStore } from '../../src/stores/missionStore';
import { useShelfStore } from '../../src/stores/shelfStore';
import { useBoxEquipStore } from '../../src/stores/boxEquipStore';
import { useConveyorStore } from '../../src/stores/conveyorStore';
import { buildInboundMission, buildOutboundMission } from '../../src/missions/builders/missionBuilder';
import { getInboundPortForShelfZ, getOutboundPortForShelfZ, getPortSpawnPosition, getPortConveyorId } from '../../src/missions/config/portConfigs';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export default function ConveyorRegression() {
  const [status, setStatus] = useState('Ready');
  const [results, setResults] = useState([]);
  const run = async () => {
    // This harness must never create or delete production inventory.
    const api = new URL(API_BASE_URL);
    if (!['localhost', '127.0.0.1'].includes(api.hostname)) { setStatus('Requires local test backend'); return; }
    setStatus('Running');
    const rows = [];
    try {
      if (Object.keys(useBoxStore.getState().boxesData).length) throw Error('Use an empty test database');
      for (const [index, shelfId] of (new URLSearchParams(location.search).get('shelves')?.split(',') || ['shelf001', 'shelf001', 'shelf090', 'shelf181', 'shelf361']).entries()) {
        const shelfPosition = useShelfStore.getState().getShelfPosition(shelfId);
        const boxId = `conveyor-regression-${Date.now()}-${index}`;
        for (const direction of ['inbound', 'outbound']) {
          const portId = direction === 'inbound' ? getInboundPortForShelfZ(shelfPosition[2]) : getOutboundPortForShelfZ(shelfPosition[2]);
          setStatus(`${shelfId} ${direction}`);
          if (direction === 'inbound') {
            await useBoxStore.getState().addBox(boxId, { id: boxId, position: getPortSpawnPosition(portId, direction), content: {} });
            // Start after sleeping on the stopped inlet, not during the initial fall.
            await delay(8000);
          }
          const started = performance.now();
          const builder = direction === 'inbound' ? buildInboundMission : buildOutboundMission;
          useMissionStore.getState().setMission(builder({ portId, boxId, shelfPosition }));
          const mission = await useMissionStore.getState().runMission();
          await delay(1000);
          const equipment = useBoxEquipStore.getState().boxCollisionStatus[boxId];
          const target = direction === 'inbound' ? shelfId : getPortConveyorId(portId);
          const row = { shelfId, direction, status: mission?.status, seconds: (performance.now() - started) / 1000,
            equipment, target, position: useBoxStore.getState().getBoxWorldPosition(boxId),
            conveyorsStopped: Object.values(useConveyorStore.getState().conveyorStates).every(c => !c.rotate) };
          rows.push(row); setResults([...rows]);
          if (mission?.status !== 'done' || !row.conveyorsStopped || equipment !== target) throw Error(`Failed ${shelfId} ${direction}`);
        }
        await useBoxStore.getState().disableGroundBox(boxId);
      }
      setStatus('COMPLETE');
    } catch (error) { setStatus(String(error)); }
  };
  return <aside style={{ position: 'absolute', right: 8, top: 70, zIndex: 30, background: '#fff', color: '#111', padding: 10, maxWidth: 430, maxHeight: '70vh', overflow: 'auto' }}>
    <button disabled={status !== 'Ready'} onClick={run}>Run conveyor regression</button>
    <p data-testid="regression-status">{status}</p><pre data-testid="regression-results">{JSON.stringify(results, null, 2)}</pre>
  </aside>;
}
