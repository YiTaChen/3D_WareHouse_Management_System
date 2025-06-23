import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { cranePickupMission } from '..//../missions/craneMissionData';

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
      if (
        (step.functionKey === 'craneBindingBox' 
          || step.functionKey === 'craneUnBindingBox') &&
        
        injectedParams.boxIds?.[step.id]
      ) {
        step.params.boxId = injectedParams.boxIds[step.id];
      }



      });
    });

    return mission;
  };



   
  const customMission = injectMissionParams(cranePickupMission, {
      craneName: 'crane001',
      targetPositions: {
        task1: [0, 0, -2],     // Crane move to port
        task3: [-6, 3, -8],    // Crane move to shelf
      },
      boxIds: {
        step3: selectedBoxId,
      },
    });


  return (
    <div style={{ padding: '1rem', background: '#eee', borderRadius: 8 }}>
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

      <button onClick={() => setMission(JSON.parse(JSON.stringify(customMission)))}>


        
        Load Mission
      </button>
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
