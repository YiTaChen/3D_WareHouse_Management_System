import { useRef, useEffect, useCallback, useState } from 'react';
import { useLockConstraint } from '@react-three/cannon';
import * as THREE from 'three';
import { useBindingStore } from '../stores/bindingStore'; // 引入綁定 Store
import { useCraneStore } from '../stores/craneStore'; // Import craneStore
import { useBoxStore } from '../stores/boxStore';     // Import boxStore


/**
 * 處理物理體之間綁定/解綁定的自定義 Hook。
 * @param {string} craneId - 執行綁定操作的 Crane 的 ID。
 */
export const useObjectBinding = (craneId) => {
    const { setCraneBinding, getCraneBinding, isObjectBoundToAnyCrane, isCraneBound } = useBindingStore();


    const getMoveTableRef = useCraneStore(state => state.getMoveTableRef); // Get getter for moveTable ref
    const getBoxRef = useBoxStore(state => state.getBoxRef);               // Get getter for box ref


    // 用於動態設定約束的兩個物理體引用
    const [constrainedBodies, setConstrainedBodies] = useState({ bodyA: null, bodyB: null });

  // useLockConstraint hook 會監聽 constrainedBodies 的變化來創建/銷毀約束
  // 當 bodyA 和 bodyB 都為 null 時，約束不會被創建
    const [constraintApi] = useLockConstraint(
    constrainedBodies.bodyA,
    constrainedBodies.bodyB,
    {
      maxForce: 1e6, // 足夠大的力，確保剛性連接
      maxBias: 1e6, // 足夠大的偏差校正，減少抖動
      // pivotA: [0, 0, 0], // 相對於 bodyA 本地中心
      // pivotB: [0, 0, 0], // 相對於 bodyB 本地中心
      // 對於 LockConstraint，通常預設 [0,0,0] 就行，它會鎖定當前相對位置和旋轉
    }
  );



  // 當組件卸載時，確保移除綁定
  useEffect(() => {
    return () => {
      const currentBinding = getCraneBinding(craneId);
      if (currentBinding && currentBinding.boundObjectId) {
        // 如果這個 Crane 綁定了物件，且該物件還沒有被其他操作解綁，則解除綁定
        // console.log(`Unbinding object ${currentBinding.boundObjectId} from crane ${craneId} on unmount.`);
        currentBinding.constraintApi?.remove(); // 移除約束
        setCraneBinding(craneId, null, null); // 清除 store 狀態
      }
    };
  }, [craneId, getCraneBinding, setCraneBinding]);



    /**
   * 嘗試綁定一個載具物理體到 Crane 的 movePlate 物理體上。
   * @param {string} targetBoxId - 目標 Box 的 ID。
   * @returns {boolean} - 如果成功綁定返回 true，否則 false。
   */
    const bindObject = useCallback((targetBoxId) => { // Removed ref parameters
        // 1. Get refs from stores using IDs
        const movePlateRef = getMoveTableRef(craneId);
        const boxRef = getBoxRef(targetBoxId);

        if (!boxRef || !boxRef.current || !movePlateRef || !movePlateRef.current) {
        console.warn(`Cannot bind: Box (${targetBoxId}) or MoveTable (${craneId}) physics ref not available in store.`);
        return false;
        }

        if (isObjectBoundToAnyCrane(targetBoxId)) {
        console.warn(`Object ${targetBoxId} is already bound to another crane. Cannot bind.`);
        return false;
        }

        if (isCraneBound(craneId)) {
        console.warn(`Crane ${craneId} is already bound to an object. Unbind first.`);
        return false;
        }

        setConstrainedBodies({
        bodyA: movePlateRef,
        bodyB: boxRef,
        });

        setCraneBinding(craneId, targetBoxId, constraintApi);
        console.log(`Attempted to bind object ${targetBoxId} to crane ${craneId}.`);
        return true;

    }, [craneId, isObjectBoundToAnyCrane, isCraneBound, setCraneBinding, constraintApi, setConstrainedBodies, getMoveTableRef, getBoxRef]); // Added new dependencies



  /**
   * 解除 Crane 和其綁定物件之間的約束。
   * @param {string} objectId - 被解除綁定物件的 ID (用於驗證)。
   * @returns {boolean} - 如果成功解除綁定返回 true，否則 false。
   */
  const unbindObject = useCallback((objectId) => {
    const currentBinding = getCraneBinding(craneId);

    if (!currentBinding || !currentBinding.boundObjectId || currentBinding.boundObjectId !== objectId) {
      console.warn(`Crane ${craneId} is not currently bound to object ${objectId}.`);
      return false;
    }

    // 將物理體設回 null，這會觸發 useLockConstraint 銷毀約束
    setConstrainedBodies({ bodyA: null, bodyB: null });

    // 清除 store 中的綁定狀態
    setCraneBinding(craneId, null, null);
    console.log(`Successfully unbound object ${objectId} from crane ${craneId}.`);
    return true;

  }, [craneId, getCraneBinding, setCraneBinding, setConstrainedBodies]);

  return { bindObject, unbindObject, isCraneBound: isCraneBound(craneId) };
};



