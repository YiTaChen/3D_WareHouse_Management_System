import { useCraneStore } from '../../stores/craneStore';
import { useBoxStore } from '../../stores/boxStore';
import { useBoxEquipStore } from '../../stores/boxEquipStore';
import { useConveyorStore } from '../../stores/conveyorStore';
import {
  applyBoxBindingTransform,
  getBoxBindingTransform,
  isPositionWithinTolerance,
  waitForBoxPosition,
} from '../../components/boxBinding.js';

const checkBoxOnEquipment = async ({ boxId, equipmentId, tryCount = 0 }) => {
  const getEquipmentForBox = useBoxEquipStore.getState().getEquipmentForBox;

  const maxTryCount = 10;
  const tryInterval = 500;
  tryCount++;

  if (!getEquipmentForBox) {
    console.warn('[checkBoxOnEquipment] 無法取得 getEquipmentForBox');
    return false;
  }

  await new Promise((resolve) => setTimeout(resolve, tryInterval));

  const isOnEquipment = getEquipmentForBox(boxId);
  console.log(`[checkBoxOnEquipment] 嘗試 ${tryCount} 次，Boxid ${boxId} 當前在設備 ${isOnEquipment} 上`);
  if (isOnEquipment === equipmentId) {
    return true;
  } else {
    if (tryCount < maxTryCount) {
      return checkBoxOnEquipment({ boxId, equipmentId, tryCount });
    } else {
      console.warn(`[checkBoxOnEquipment] 嘗試 ${tryCount} 次後仍未找到 Box ${boxId} 在設備 ${equipmentId} 上`);
      return false;
    }
  }
};

const synchronizeBoxWithCrane = async ({ boxId, craneId }) => {
  const craneState = useCraneStore.getState().craneStates[craneId];
  const boxStore = useBoxStore.getState();
  const boxApi = boxStore.getBoxRef(boxId)?.api;
  const transform = getBoxBindingTransform(craneState);

  if (!craneState || craneState.isCraneMoving || craneState.isMoveTableMoving) {
    console.warn(`[boxBinding] ${craneId} 尚未停止，拒絕切換 Box ${boxId} 綁定狀態`);
    return false;
  }
  if (!boxApi?.position?.set || !boxApi.position.subscribe || !transform) {
    console.warn(`[boxBinding] Box ${boxId} 或 ${craneId} 的 physics ref 尚未就緒`);
    return false;
  }

  const currentWorldPosition = boxStore.getBoxWorldPosition(boxId);
  if (isPositionWithinTolerance(currentWorldPosition, transform.position)) {
    boxApi.wakeUp?.();
    return applyBoxBindingTransform(boxApi, transform);
  }

  const confirmation = waitForBoxPosition({
    subscribe: (listener) => boxApi.position.subscribe(listener),
    expectedPosition: transform.position,
  });

  boxApi.wakeUp?.();
  if (!applyBoxBindingTransform(boxApi, transform)) return false;
  return confirmation;
};

export const stepFunctions = {
  moveCraneTable: async ({ craneName, offset, speed }) => {
    const fn = useCraneStore.getState().setMoveTableTargetLocalOffset;
    if (!fn) {
      console.warn('[moveCraneTable] 無法取得 setMoveTableTargetLocalOffset');
      return false;
    }

    // 執行動作
    fn(craneName, offset, speed);

    // 等待完成：你已經有 `isMoveTableMoving` 狀態可用來監測
    const waitUntilArrived = () =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        const maxWait = 10000;
        const tick = () => {
          const state = useCraneStore.getState().craneStates[craneName];
          if (!state || !state.isMoveTableMoving) return resolve(true);
          if (Date.now() - start > maxWait) return reject('timeout');
          requestAnimationFrame(tick);
        };
        tick();
      });

    try {
      await waitUntilArrived();
      return true;
    } catch {
      console.warn(`[moveCraneTable] 等待 ${craneName} 移動完成時逾時`);
      return false;
    }
  },

  moveCrane: async ({ craneName, targetPosition, speed }) => {
    const fn = useCraneStore.getState().setCraneTargetPosition;
    if (!fn) {
      console.warn('[moveCrane] 無法取得 setCraneTargetPosition');
      return false;
    }

    // 執行動作
    fn(craneName, targetPosition, speed);

    // 等待完成：你已經有 `isMoveTableMoving` 狀態可用來監測
    const waitUntilArrived = () =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        const maxWait = 10000;
        const tick = () => {
          const state = useCraneStore.getState().craneStates[craneName];

          if (!state || !state.isCraneMoving) return resolve(true);
          if (Date.now() - start > maxWait) return reject('timeout');
          requestAnimationFrame(tick);
        };
        tick();
      });

    try {
      await waitUntilArrived();
      return true;
    } catch {
      console.warn(`[moveCrane] 等待 ${craneName} 移動完成時逾時`);
      return false;
    }
  },

  craneBindingBox: async ({ craneId, boxId }) => {
    const boxStore = useBoxStore.getState();
    const bindFn = boxStore.setBoxBoundToMoveplate;
    const unbindFn = boxStore.clearBoxBoundToMoveplate;

    if (!boxId || !craneId || !bindFn || !unbindFn) {
      console.warn('[craneBindingBox] 缺少 box/crane ID 或 binding action');
      return false;
    }

    bindFn(boxId, craneId);
    const confirmed = await synchronizeBoxWithCrane({ boxId, craneId });

    if (!confirmed) {
      unbindFn(boxId);
      console.warn(`[craneBindingBox] Box ${boxId} 未實際到達 ${craneId} platetable，已取消綁定`);
      return false;
    }

    return true;
  },

  craneUnBindingBox: async ({ craneId, boxId }) => {
    const boxStore = useBoxStore.getState();
    const unbindFn = boxStore.clearBoxBoundToMoveplate;
    const boundCraneId = boxStore.getBoxBoundMoveplate(boxId);

    if (!boxId || !unbindFn || !boundCraneId || (craneId && craneId !== boundCraneId)) {
      console.warn(`[craneUnBindingBox] Box ${boxId} 沒有對應的有效綁定`);
      return false;
    }

    const confirmed = await synchronizeBoxWithCrane({ boxId, craneId: boundCraneId });
    if (!confirmed) {
      console.warn(`[craneUnBindingBox] Box ${boxId} 釋放位置未確認，保留綁定並停止 mission`);
      return false;
    }

    unbindFn(boxId);
    useBoxStore.getState().getBoxRef(boxId)?.api?.wakeUp?.();

    return true;
  },

  setCustomerConveyorRotate: async ({ conveyorId, rotate }) => {
    const setRotateFn = useConveyorStore.getState().setConveyorRotate;

    if (!setRotateFn) {
      console.warn('[setConveyorRotate] 無法取得 setConveyorRotate');
      return false;
    }

    // 執行旋轉
    setRotateFn(conveyorId, rotate);

    // 模擬等待：固定等待 1 秒
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  },

  startConveyorRotate: async ({ conveyorId, boxId, waitMs = 1000 }) => {
    // 如果 conveyorId 是 'pass'，則不執行旋轉
    if (conveyorId != 'pass') {
      const setStartFn = useConveyorStore.getState().setConveyorRotate;

      if (!setStartFn) {
        console.warn('[startConveyorRotate] 無法取得 setConveyorRotate');
        return false;
      }

      // 執行開始旋轉
      setStartFn(conveyorId, true);

      // Outbound boxes may have gone to sleep while waiting on a stopped conveyor.
      if (boxId) {
        useBoxStore.getState().wakeUpBox(boxId);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, waitMs));

    return true;
  },

  stopConveyorRotate: async ({ conveyorId }) => {
    // 如果 conveyorId 是 'pass'，則不執行
    if (conveyorId != 'pass') {
      const setStopFn = useConveyorStore.getState().setConveyorRotate;

      if (!setStopFn) {
        console.warn('[stopConveyorRotate] 無法取得 setConveyorRotate');
        return false;
      }

      // 執行停止
      setStopFn(conveyorId, false);
    }
    // 模擬等待：固定等待 1 秒
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  },

  setConveyorRotateSpeedPositive: async ({ conveyorId }) => {
    // 如果 conveyorId 是 'pass'，則不執行停止
    if (conveyorId != 'pass') {
      const setSpeedFn = useConveyorStore.getState().setConveyorSpeed;

      if (!setSpeedFn) {
        console.warn('[setSpeedFn] 無法取得 setConveyorSpeed');
        return false;
      }

      // speed value: negative value conduct positive rotation
      const positiveSpeed = 0 - Math.abs(useConveyorStore.getState().conveyorStates[conveyorId].speed);

      // 執行停止
      setSpeedFn(conveyorId, positiveSpeed);
    }
    // 模擬等待：固定等待 0.5 秒
    await new Promise((resolve) => setTimeout(resolve, 500));

    return true;
  },

  setConveyorRotateSpeedNagetive: async ({ conveyorId }) => {
    console.log(`aaa [setConveyorRotateSpeedNagetive] 停止輸送帶 ${conveyorId} 的旋轉`);

    // 如果 conveyorId 是 'pass'，則不執行停止
    if (conveyorId != 'pass') {
      const setSpeedFn = useConveyorStore.getState().setConveyorSpeed;

      console.log(`bbbb [setConveyorRotateSpeedNagetive] 停止輸送帶 ${conveyorId} 的旋轉`);

      if (!setSpeedFn) {
        console.warn('[setSpeedFn] 無法取得 setConveyorSpeed');
        return false;
      }

      // speed value: negative value conduct positive rotation
      const nagetiveSpeed = Math.abs(useConveyorStore.getState().conveyorStates[conveyorId].speed);

      console.log(` setConveyorRotateSpeedNagetive: ${nagetiveSpeed} `);

      // 執行停止
      setSpeedFn(conveyorId, nagetiveSpeed);
    }
    // 模擬等待：固定等待 0.5 秒
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  },

  setConveyorRotateSpeed: async ({ conveyorId, speedNumber }) => {
    // 如果 conveyorId 是 'pass'，則不執行停止
    if (conveyorId != 'pass') {
      const setSpeedFn = useConveyorStore.getState().setConveyorSpeed;

      if (!setSpeedFn) {
        console.warn('[setSpeedFn] 無法取得 setConveyorSpeed');
        return false;
      }

      // 執行停止
      setSpeedFn(conveyorId, speedNumber);
    }
    // 模擬等待：固定等待 0.5 秒
    await new Promise((resolve) => setTimeout(resolve, 500));

    return true;
  },

  checkBoxOnEquipment,

  updateBoxCurrentPositionServerHandler: async ({ boxId }) => {
    const updateBoxPos = useBoxStore.getState().updateBoxCurrentPositionServer;

    if (!updateBoxPos) {
      console.warn('[updateBoxPos] 無法取得 updateBoxCurrentPositionServer');
      return false;
    }

    // 執行
    updateBoxPos(boxId);

    // 模擬等待：固定等待 1 秒
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  },

  removeBoxCurrentPositionServerHandler: async ({ boxId }) => {
    const removeBoxPos = useBoxStore.getState().softDeleteOneBoxData;

    if (!removeBoxPos) {
      console.warn('[removeBoxPos] 無法取得 softDeleteOneBoxData');
      return false;
    }

    // 執行
    removeBoxPos(boxId);

    // 模擬等待：固定等待 1 秒
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  },
};
