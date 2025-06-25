
import { useCraneStore } from '../stores/craneStore';
import { useBoxStore } from '../stores/boxStore';
import { CraneData } from '../data/CraneData';
import { ShelfData } from '../data/ShelfData';
import { ConveyorData } from '../data/layoutData';
import { PortData } from '../data/PortData';
import { CRANE_CONSTANTS } from '../constants/craneConfig';
import { stepFunctions } from '../missions/stepFunctions'; // 導入所有 stepFunctions
import { missionTemplates } from '../missions/missionTaskTemplates'; // 導入 missionTemplates

/**
 * 獲取輸送帶路徑。
 * 在實際應用中，這會是一個複雜的尋路算法。
 * 目前，為了範例目的，我們使用硬編碼路徑。
 * @param {string} startConvId - 起始輸送帶 ID。
 * @param {string} endConvId - 結束輸送帶 ID。
 * @returns {Array<object>} 包含所有經過的輸送帶對象的陣列。
 */
const getConveyorPath = (startConvId, endConvId) => {
  const path = [];
  const findConv = (id) => ConveyorData.conveyors.find(c => c.id === id);

  // Crane001 Inbound: Port1 (conv1) -> conv3
  if (startConvId === 'conv1' && endConvId === 'conv3') {
    return [findConv('conv1'), findConv('conv2'), findConv('conv3')].filter(Boolean);
  }
  // Crane001 Outbound: conv6 -> Port2 (conv4)
  if (startConvId === 'conv6' && endConvId === 'conv4') {
    return [findConv('conv6'), findConv('conv5'), findConv('conv4')].filter(Boolean);
  }
  // Crane002 Inbound: Port3 (conv7) -> conv9
  if (startConvId === 'conv7' && endConvId === 'conv9') {
      return [findConv('conv7'), findConv('conv8'), findConv('conv9')].filter(Boolean);
  }
  // Crane002 Outbound: conv9 -> Port3 (conv7)
  if (startConvId === 'conv9' && endConvId === 'conv7') {
      return [findConv('conv9'), findConv('conv8'), findConv('conv7')].filter(Boolean);
  }
  // Crane003 Inbound: Port4 (conv10) -> conv12
  if (startConvId === 'conv10' && endConvId === 'conv12') {
      return [findConv('conv10'), findConv('conv11'), findConv('conv12')].filter(Boolean);
  }
  // Crane003 Outbound: conv13 -> Port5 (conv19)
  if (startConvId === 'conv13' && endConvId === 'conv19') {
      return [findConv('conv13'), findConv('conv14'), findConv('conv16'), findConv('conv17'), findConv('conv18'), findConv('conv19')].filter(Boolean);
  }

  console.warn(`[getConveyorPath] 未定義從 ${startConvId} 到 ${endConvId} 的輸送帶路徑。`);
  return [];
};


/**
 * 根據任務類型和動態參數生成一個完整的可執行任務。
 * 這個函數是任務生成的核心，它會根據邏輯自動選擇 Crane、計算位置和 MovePlate 偏移。
 * @param {string} missionType - 任務的類型，例如 'INBOUND_TO_SHELF' 或 'OUTBOUND_FROM_SHELF'。
 * @param {object} dynamicParams - 包含任務所需動態數據的物件，如 boxId, fromPortId, toShelfId 等。
 * @returns {object|null} 完整的任務物件，如果生成失敗則返回 null。
 */
export const generateMission = (missionType, dynamicParams) => {
  const { boxId, fromPortId, toShelfId, fromShelfId, toPortId } = dynamicParams;

  const missionTemplate = missionTemplates[missionType];
  if (!missionTemplate) {
    console.error(`[generateMission] 未找到任務類型: ${missionType}`);
    return null;
  }

  let selectedCrane = null;
  let craneName = null;
  let targetShelf = null;
  let currentPortConfig = null; // 統一使用這個來指代當前的 Port 配置 (inbound 或 outbound)
  let craneOperatingPointConv = null; // Crane 將要操作的輸送帶物件 (取貨或放貨點)

  // --- 確定任務方向和主要參數 ---
  if (missionType === 'INBOUND_TO_SHELF') {
    currentPortConfig = PortData.inboundPorts[fromPortId];
    if (!currentPortConfig) { console.error(`[generateMission] 未找到入庫埠 ID: ${fromPortId}`); return null; }

    selectedCrane = CraneData.cranes.find(c => c.id === currentPortConfig.craneId);
    if (!selectedCrane) { console.error(`[generateMission] 未找到 Crane ID: ${currentPortConfig.craneId}`); return null; }
    craneName = selectedCrane.id;

    craneOperatingPointConv = ConveyorData.conveyors.find(c => c.id === currentPortConfig.cranePickupPointConvId);
    if (!craneOperatingPointConv) { console.error(`[generateMission] 未找到 Crane 取貨輸送帶 ID: ${currentPortConfig.cranePickupPointConvId}`); return null; }

    targetShelf = ShelfData.shelves.find(s => s.id === toShelfId);
    if (!targetShelf) { console.error(`[generateMission] 未找到目標貨架 ID: ${toShelfId}`); return null; }

  } else if (missionType === 'OUTBOUND_FROM_SHELF') {
    currentPortConfig = PortData.outboundPorts[toPortId];
    if (!currentPortConfig) { console.error(`[generateMission] 未找到出庫埠 ID: ${toPortId}`); return null; }

    selectedCrane = CraneData.cranes.find(c => c.id === currentPortConfig.craneId);
    if (!selectedCrane) { console.error(`[generateMission] 未找到 Crane ID: ${currentPortConfig.craneId}`); return null; }
    craneName = selectedCrane.id;

    craneOperatingPointConv = ConveyorData.conveyors.find(c => c.id === currentPortConfig.craneDropPointConvId);
    if (!craneOperatingPointConv) { console.error(`[generateMission] 未找到 Crane 放置輸送帶 ID: ${currentPortConfig.craneDropPointConvId}`); return null; }

    targetShelf = ShelfData.shelves.find(s => s.id === fromShelfId); // 出庫時，貨架是來源
    if (!targetShelf) { console.error(`[generateMission] 未找到來源貨架 ID: ${fromShelfId}`); return null; }
  } else {
    console.error(`[generateMission] 不支援的任務類型: ${missionType}`);
    return null;
  }

  // 確保最終確定了 craneName 和 selectedCrane
  if (!craneName || !selectedCrane) {
      console.error(`[generateMission] 無法確定要使用的 Crane。`);
      return null;
  }

  const generatedTasks = missionTemplate.tasks.map((taskTemplate, taskIndex) => {
    const generatedSteps = taskTemplate.template.map((stepDef, stepIndex) => {
      const { template: stepTemp, overrides: stepOverrides = {} } = stepDef;

      let params = {};
      params.craneName = craneName; // 大部分 Crane 相關步驟都需要
      params.boxId = boxId; // 大部分 Box 相關步驟都需要

      // 步驟特定的目標位置 (用於 Crane 移動)
      let currentCraneTargetPosition = null;
    // console.log(`[generateMission] 處理任務 "${taskTemplate.name}" 的步驟: ${stepDef.name} (functionKey: ${stepTemp})`);
      // --- 動態計算每個步驟的參數 ---
      switch (stepTemp.functionKey) {
        case 'moveBoxOnConveyor':
          if (missionType === 'INBOUND_TO_SHELF') {
            params.conveyorPath = getConveyorPath(fromPortId.replace('port', 'conv'), craneOperatingPointConv.id);
            params.finalConveyorId = craneOperatingPointConv.id;
          } else if (missionType === 'OUTBOUND_FROM_SHELF') {
            // 從 Crane 放下 Box 的 Conveyor 到最終 Port 的 Conveyor
            params.conveyorPath = getConveyorPath(craneOperatingPointConv.id, toPortId.replace('port', 'conv'));
            params.finalConveyorId = toPortId.replace('port', 'conv');
          }
          break;

        case 'boxArriveOnConveyor':
          params.conveyorId = craneOperatingPointConv.id; // Box 到達 Crane 操作點的 Conveyor
          break;

        case 'boxLeaveConveyor':
          params.conveyorId = craneOperatingPointConv.id; // Box 從 Crane 操作點的 Conveyor 離開
          break;

        case 'moveCrane':
          params.speed = stepOverrides.speed || CRANE_CONSTANTS.DEFAULT_CRANE_SPEED;

          if (stepDef.name === 'Crane move to conveyor pickup point' && missionType === 'INBOUND_TO_SHELF') {
            currentCraneTargetPosition = currentPortConfig.craneTargetPosition;
          } else if (stepDef.name === 'Crane move to conveyor drop point' && missionType === 'OUTBOUND_FROM_SHELF') {
            currentCraneTargetPosition = currentPortConfig.craneTargetPosition;
          } else if (stepDef.name === 'Crane move to Shelf' && targetShelf) {
            // Crane 移動到貨架旁 (X 軸對齊 Shelf, Y 軸為 Crane 自身高, Z 軸為 Crane 軌道 Z)
            currentCraneTargetPosition = [
              targetShelf.position[0],
              selectedCrane.position[1],
              selectedCrane.operatingZ,
            ];
          } else if (stepDef.name === 'Crane move back') {
            currentCraneTargetPosition = selectedCrane.position; // Crane 歸位位置
          } else {
            console.warn(`[generateMission] moveCrane: 無法為任務 "${taskTemplate.name}" 確定目標位置。`);
            currentCraneTargetPosition = [0, 0, 0]; // Fallback
          }
          params.targetPosition = currentCraneTargetPosition;
          break;

        case 'moveCraneTable':
          params.speed = stepOverrides.speed || CRANE_CONSTANTS.DEFAULT_TABLE_SPEED;

          // 計算平台 Y 軸偏移： Box 實際 Y 高度 - Crane 軌道 Y 高度
          // Box 實際 Y 高度： 物體所在平面 Y 高度 + Box 相對於該平面的 Y 偏移 (物理尺寸)
          let targetPlateYOffset = 0;
          let targetPlateXOffset = 0;
          let targetPlateZOffset = 0;

          // Inbound: 從 Conveyor 取貨
          if (stepDef.name.includes('from conveyor') && missionType === 'INBOUND_TO_SHELF') {
            const boxActualYAtConv = craneOperatingPointConv.position[1] + (currentPortConfig.boxPickupYOffsetFromConv || 0);
            targetPlateYOffset = boxActualYAtConv - selectedCrane.position[1];

            // 平台停在 Crane 的 X,Y 處，Z 延伸到 Conveyor Z。
            // 由於 Crane 已經移動到 Conveyor 的 X 處，所以 X 偏移為 0。
            // Z 偏移是 Conveyor Z 減去 Crane 軌道 Z。
            targetPlateXOffset = 0;
            targetPlateZOffset = craneOperatingPointConv.position[2] - selectedCrane.operatingZ;

            // 只有當平台伸出和抬升時才需要這些精確偏移
            if (stepDef.name === 'extend platform to take box from conveyor' || stepDef.name === 'upward to take box from conveyor') {
              params.offset = [targetPlateXOffset, targetPlateYOffset, targetPlateZOffset];
            } else if (stepDef.name === 'collect platform after pickup' || stepDef.name === 'downward to original position after pickup') {
              params.offset = [CRANE_CONSTANTS.COLLECT_PLATE_X_OFFSET, CRANE_CONSTANTS.COLLECT_PLATE_Y_OFFSET, CRANE_CONSTANTS.COLLECT_PLATE_Z_OFFSET];
            }
          }
          // Inbound: 放置到 Shelf
          else if (stepDef.name.includes('on shelf') && missionType === 'INBOUND_TO_SHELF') {
            const boxActualYAtShelf = targetShelf.position[1] + (CRANE_CONSTANTS.PICK_AND_PUT_Y_OFFSET || 0);
            targetPlateYOffset = boxActualYAtShelf - selectedCrane.position[1];

            // Crane 已經在 Shelf 的 X 軸位置，但 MovePlate 需要精確對準 Shelf 的 X 軸位置
            targetPlateXOffset = targetShelf.position[0] - (currentCraneTargetPosition ? currentCraneTargetPosition[0] : selectedCrane.position[0]);
            targetPlateZOffset = targetShelf.position[2] - selectedCrane.operatingZ;

            if (stepDef.name === 'upward extend platform' || stepDef.name === 'extend platform to shelf') {
                params.offset = [targetPlateXOffset, targetPlateYOffset, targetPlateZOffset];
            } else if (stepDef.name === 'downward platform') {
                params.offset = [targetPlateXOffset, CRANE_CONSTANTS.COLLECT_PLATE_Y_OFFSET, targetPlateZOffset]; // Y 歸位，X,Z 仍在 Shelf 位置
            } else if (stepDef.name === 'collect platform') {
                params.offset = [CRANE_CONSTANTS.COLLECT_PLATE_X_OFFSET, CRANE_CONSTANTS.COLLECT_PLATE_Y_OFFSET, CRANE_CONSTANTS.COLLECT_PLATE_Z_OFFSET];
            }
          }
          // Outbound: 從 Shelf 取貨
          else if (stepDef.name.includes('from shelf') && missionType === 'OUTBOUND_FROM_SHELF') {
              const boxActualYAtShelf = targetShelf.position[1] + (CRANE_CONSTANTS.PICK_AND_PUT_Y_OFFSET || 0);
              targetPlateYOffset = boxActualYAtShelf - selectedCrane.position[1];

              targetPlateXOffset = targetShelf.position[0] - (currentCraneTargetPosition ? currentCraneTargetPosition[0] : selectedCrane.position[0]);
              targetPlateZOffset = targetShelf.position[2] - selectedCrane.operatingZ;

               if (stepDef.name === 'upward extend platform to take box from shelf' || stepDef.name === 'extend platform to take box from shelf') {
                  params.offset = [targetPlateXOffset, targetPlateYOffset, targetPlateZOffset];
               } else if (stepDef.name === 'collect platform after pickup from shelf' || stepDef.name === 'downward to original position after pickup from shelf') {
                   params.offset = [CRANE_CONSTANTS.COLLECT_PLATE_X_OFFSET, CRANE_CONSTANTS.COLLECT_PLATE_Y_OFFSET, CRANE_CONSTANTS.COLLECT_PLATE_Z_OFFSET];
               }
          }
          // Outbound: 放置到 Conveyor
          else if (stepDef.name.includes('on conveyor') && missionType === 'OUTBOUND_FROM_SHELF') {
            const boxActualYAtConv = craneOperatingPointConv.position[1] + (currentPortConfig.boxDropYOffsetToConv || 0);
            targetPlateYOffset = boxActualYAtConv - selectedCrane.position[1];

            targetPlateXOffset = 0; // 假定 Crane 停靠在 Conveyor 的 X 軸中心
            targetPlateZOffset = craneOperatingPointConv.position[2] - selectedCrane.operatingZ;

            if (stepDef.name === 'upward extend platform before drop' || stepDef.name === 'extend platform to conveyor drop point') {
              params.offset = [targetPlateXOffset, targetPlateYOffset, targetPlateZOffset];
            } else if (stepDef.name === 'downward platform after drop' || stepDef.name === 'collect platform after drop') {
              params.offset = [CRANE_CONSTANTS.COLLECT_PLATE_X_OFFSET, CRANE_CONSTANTS.COLLECT_PLATE_Y_OFFSET, CRANE_CONSTANTS.COLLECT_PLATE_Z_OFFSET];
            }
          }
          else {
              // 對於未特別處理的 moveCraneTable 步驟，使用模板中的默認偏移或歸位
              params.offset = stepOverrides.offset || [CRANE_CONSTANTS.COLLECT_PLATE_X_OFFSET, CRANE_CONSTANTS.COLLECT_PLATE_Y_OFFSET, CRANE_CONSTANTS.COLLECT_PLATE_Z_OFFSET];
          }
          break;

        case 'craneBindingBox':
        case 'craneUnBindingBox':
          params.craneId = craneName;
          params.boxId = boxId;
          break;

        default:
          console.warn(`未知 functionKey: ${stepTemp.functionKey} for step: ${stepDef.name}`);
      }

      return {
        id: `${taskTemplate.id}_step${stepIndex + 1}`,
        name: stepDef.name || stepTemp.name || `${stepTemp.functionKey} step`,
        functionKey: stepTemp.functionKey,
        params: params,
        status: 'pending',
      };
    });

    return {
      id: taskTemplate.id,
      name: taskTemplate.name,
      currentStepIndex: 0,
      status: 'pending',
      steps: generatedSteps,
    };
  });

  return {
    ...missionTemplate,
    id: `${missionTemplate.id}_${boxId || 'N/A'}_${Date.now()}`,
    currentTaskIndex: 0,
    status: 'pending',
    tasks: generatedTasks,
  };
};

/**
 * 執行一個給定的任務。
 * 這個函數會按照任務中的步驟順序執行，並更新狀態。
 * @param {object} mission - 要執行的任務物件。
 * @returns {Promise<boolean>} - 如果所有步驟都成功完成，則返回 true，否則返回 false。
 */
export const executeMission = async (mission) => {
  console.log(`[Mission Executor] 開始執行任務: ${mission.name} (${mission.id})`);
  for (let taskIndex = mission.currentTaskIndex; taskIndex < mission.tasks.length; taskIndex++) {
    const task = mission.tasks[taskIndex];
    console.log(`[Mission Executor] 開始執行子任務: ${task.name} (${task.id})`);
    task.status = 'running';
    for (let stepIndex = task.currentStepIndex; stepIndex < task.steps.length; stepIndex++) {
      const step = task.steps[stepIndex];
      console.log(`[Mission Executor] 執行步驟: ${step.name} (${step.id})`, JSON.stringify(step.params));
      step.status = 'running';
      const stepFunction = stepFunctions[step.functionKey];
      if (stepFunction) {
        try {
          const success = await stepFunction(step.params);
          step.status = success ? 'completed' : 'failed';
          if (!success) {
            console.error(`[Mission Executor] 步驟執行失敗: ${step.name} (${step.id})`);
            mission.status = 'failed';
            return false;
          }
        } catch (error) {
          console.error(`[Mission Executor] 步驟執行時發生錯誤 ${step.name} (${step.id}):`, error);
          step.status = 'failed';
          mission.status = 'failed';
          return false;
        }
      } else {
        console.error(`[Mission Executor] 未知步驟函數: ${step.functionKey}`);
        step.status = 'failed';
        mission.status = 'failed';
        return false;
      }
    }
    task.status = 'completed';
    console.log(`[Mission Executor] 子任務完成: ${task.name} (${task.id})`);
  }
  mission.status = 'completed';
  console.log(`[Mission Executor] 所有任務完成: ${mission.name} (${mission.id})`);
  return true;
};
