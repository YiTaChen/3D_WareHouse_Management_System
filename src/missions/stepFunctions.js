
import { useCraneStore } from '../stores/craneStore';
import { useBoxStore } from '../stores/boxStore';
import { ConveyorData } from '../data/ConveyorData';

/**
 * 等待 Crane 完成其移動。
 * @param {string} craneName - Crane 的 ID。
 * @param {number} timeoutMs - 最大等待時間（毫秒）。
 */
const waitForCraneMovement = (craneName, timeoutMs = 10000) => new Promise((resolve, reject) => {
    const start = Date.now();
    const checkMovement = () => {
        const state = useCraneStore.getState().craneStates[craneName];
        if (!state || !state.isCraneMoving) {
            resolve(true); // Crane 停止移動或狀態不存在，視為完成
            return;
        }
        if (Date.now() - start > timeoutMs) {
            reject(new Error(`[waitForCraneMovement] 等待 ${craneName} 移動逾時。`));
            return;
        }
        requestAnimationFrame(checkMovement);
    };
    requestAnimationFrame(checkMovement);
});

/**
 * 等待 Crane MovePlate 完成其移動。
 * @param {string} craneName - Crane 的 ID。
 * @param {number} timeoutMs - 最大等待時間（毫秒）。
 */
const waitForMoveplateMovement = (craneName, timeoutMs = 10000) => new Promise((resolve, reject) => {
    const start = Date.now();
    const checkMovement = () => {
        const state = useCraneStore.getState().craneStates[craneName];
        if (!state || !state.isMoveTableMoving) {
            resolve(true); // MovePlate 停止移動或狀態不存在，視為完成
            return;
        }
        if (Date.now() - start > timeoutMs) {
            reject(new Error(`[waitForMoveplateMovement] 等待 ${craneName} MovePlate 移動逾時。`));
            return;
        }
        requestAnimationFrame(checkMovement);
    };
    requestAnimationFrame(checkMovement);
});

export const stepFunctions = {
  /**
   * 控制 Crane 移動到目標世界座標位置。
   * @param {object} params
   * @param {string} params.craneName - 要移動的 Crane ID。
   * @param {Array<number>} params.targetPosition - 目標世界座標 [x, y, z]。
   * @param {number} params.speed - 移動速度。
   * @returns {Promise<boolean>} - 表示操作是否成功。
   */
  moveCrane: async ({ craneName, targetPosition, speed }) => {
    console.log(`[moveCrane] Crane ${craneName} 移動到 ${JSON.stringify(targetPosition)}，速度：${speed}`);
    const setTargetFn = useCraneStore.getState().setCraneTargetPosition;
    if (!setTargetFn) {
      console.warn('[moveCrane] 無法取得 setCraneTargetPosition 函數。');
      return false;
    }
    setTargetFn(craneName, targetPosition, speed);
    try {
      await waitForCraneMovement(craneName);
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },

  /**
   * 控制 Crane 的 MovePlate 相對於 Crane 自身局部坐標移動到指定偏移量。
   * @param {object} params
   * @param {string} params.craneName - Crane 的 ID。
   * @param {Array<number>} params.offset - MovePlate 的目標局部偏移 [x, y, z]。
   * @param {number} params.speed - 移動速度。
   * @returns {Promise<boolean>} - 表示操作是否成功。
   */
  moveCraneTable: async ({ craneName, offset, speed }) => {
    console.log(`[moveCraneTable] Crane ${craneName} MovePlate 移動到局部偏移 ${JSON.stringify(offset)}，速度：${speed}`);
    const setOffsetFn = useCraneStore.getState().setMoveTableTargetLocalOffset;
    if (!setOffsetFn) {
      console.warn('[moveCraneTable] 無法取得 setMoveTableTargetLocalOffset 函數。');
      return false;
    }
    setOffsetFn(craneName, offset, speed);
    try {
      await waitForMoveplateMovement(craneName);
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },

  /**
   * 將 Box 綁定到 Crane 的 MovePlate。
   * @param {object} params
   * @param {string} params.craneId - Crane 的 ID。
   * @param {string} params.boxId - Box 的 ID。
   * @returns {Promise<boolean>} - 表示操作是否成功。
   */
  craneBindingBox: async ({ craneId, boxId }) => {
    console.log(`[craneBindingBox] Crane ${craneId} 綁定 Box ${boxId}。`);
    const bindFn = useBoxStore.getState().setBoxBoundToMoveplate;
    if (!bindFn) {
      console.warn('[craneBindingBox] 無法取得 setBoxBoundToMoveplate 函數。');
      return false;
    }
    bindFn(boxId, craneId);
    await new Promise((resolve) => setTimeout(resolve, 500)); // 模擬綁定時間
    return true;
  },

  /**
   * 將 Box 從 Crane 的 MovePlate 解除綁定。
   * @param {object} params
   * @param {string} params.craneId - Crane 的 ID。
   * @param {string} params.boxId - Box 的 ID。
   * @returns {Promise<boolean>} - 表示操作是否成功。
   */
  craneUnBindingBox: async ({ craneId, boxId }) => {
    console.log(`[craneUnBindingBox] Crane ${craneId} 解除綁定 Box ${boxId}。`);
    const unbindFn = useBoxStore.getState().clearBoxBoundToMoveplate;
    if (!unbindFn) {
      console.warn('[craneUnBindingBox] 無法取得 clearBoxBoundToMoveplate 函數。');
      return false;
    }
    unbindFn(boxId);
    await new Promise((resolve) => setTimeout(resolve, 500)); // 模擬解除綁定時間
    return true;
  },

  /**
   * 模擬 Box 在一系列輸送帶上移動。
   * @param {object} params
   * @param {string} params.boxId - Box 的 ID。
   * @param {Array<object>} params.conveyorPath - 包含輸送帶物件的陣列，按順序排列。
   * @param {string} params.finalConveyorId - Box 最終停留的輸送帶 ID。
   * @returns {Promise<boolean>} - 表示操作是否成功。
   */
  moveBoxOnConveyor: async ({ boxId, conveyorPath, finalConveyorId }) => {
    console.log(`[moveBoxOnConveyor] Box ${boxId} 開始在輸送帶上移動。路徑: ${conveyorPath.map(c => c.id).join(' -> ')}`);
    const setBoxPosFn = useBoxStore.getState().setBoxPosition;
    if (!setBoxPosFn) {
      console.warn('[moveBoxOnConveyor] 無法取得 setBoxPosition 函數。');
      return false;
    }

    for (const conv of conveyorPath) {
      console.log(`  -> Box ${boxId} 移動到 ${conv.id} (${JSON.stringify(conv.position)})`);
      setBoxPosFn(boxId, conv.position); // 更新 Box 的位置到輸送帶上
      await new Promise(resolve => setTimeout(resolve, 500)); // 模擬移動時間
    }

    const finalConv = ConveyorData.conveyors.find(c => c.id === finalConveyorId);
    if (finalConv) {
        setBoxPosFn(boxId, finalConv.position); // 確保最終位置在正確的 Conveyor 上
    }
    console.log(`[moveBoxOnConveyor] Box ${boxId} 已到達最終輸送帶 ${finalConveyorId}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬 Box 停穩時間
    return true;
  },

  /**
   * 模擬 Box 從輸送帶離開（例如被 Crane 取走）。
   * @param {object} params
   * @param {string} params.boxId - Box 的 ID。
   * @param {string} params.conveyorId - Box 離開的輸送帶 ID。
   * @returns {Promise<boolean>} - 表示操作是否成功。
   */
  boxLeaveConveyor: async ({ boxId, conveyorId }) => {
    console.log(`[boxLeaveConveyor] Box ${boxId} 從輸送帶 ${conveyorId} 離開。`);
    // 在實際應用中，可能更新 Box 的狀態，使其不再顯示在輸送帶上
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  },

  /**
   * 模擬 Box 到達輸送帶（例如被 Crane 放置）。
   * @param {object} params
   * @param {string} params.boxId - Box 的 ID。
   * @param {string} params.conveyorId - Box 到達的輸送帶 ID。
   * @returns {Promise<boolean>} - 表示操作是否成功。
   */
  boxArriveOnConveyor: async ({ boxId, conveyorId }) => {
    console.log(`[boxArriveOnConveyor] Box ${boxId} 到達輸送帶 ${conveyorId}。`);
    const conv = ConveyorData.conveyors.find(c => c.id === conveyorId);
    if (conv) {
        useBoxStore.getState().setBoxPosition(boxId, conv.position); // 將 Box 位置設置到輸送帶上
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  },
};




