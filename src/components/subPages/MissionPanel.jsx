import React from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { cranePickupMission } from '..//../missions/craneMissionData';

const MissionPanel = () => {
  const mission = useMissionStore((s) => s.mission);
  const setMission = useMissionStore((s) => s.setMission);
  const runMission = useMissionStore((s) => s.runMission);

  return (
    <div style={{ padding: '1rem', background: '#eee', borderRadius: 8 }}>
      <h3>任務控制面板</h3>
      <button onClick={() => setMission(JSON.parse(JSON.stringify(cranePickupMission)))}>
        載入任務
      </button>
      <button onClick={runMission} disabled={!mission}>
        執行任務
      </button>

      {mission && (
        <div style={{ marginTop: '1rem' }}>
          <p>任務狀態：{mission.status}</p>
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
