import { useRef, useEffect, useCallback, useState } from 'react';
import { useLockConstraint } from '@react-three/cannon';
import * as THREE from 'three';
import { useBindingStore } from '../stores/bindingStore';
import { useCraneStore } from '../stores/craneStore';
import { useBoxStore } from '../stores/boxStore';

/**
 * 處理物理體之間綁定/解綁定的自定義 Hook。
 * @param {string} craneId - 執行綁定操作的 Crane 的 ID。
 */
export const useObjectBinding = (craneId) => {

    const getMoveTableRef = useCraneStore(state => state.getMoveTableRef);
  const movePlateRef = getMoveTableRef(craneId);
  //  const movePlateRef = useCraneStore(state => state.getCraneRef(craneId));
  const boxRef = useBoxStore(state => boxId ? state.getBoxRef(boxId) : null);
    
  // const boxRef = useBoxStore(state => state.getBoxRef(boxId));
  
  // 使用 useConstraint hook
  const [constraintRef] = useConstraint('Fixed', () => ({
    bodyA: movePlateRef?.ref,
    bodyB: boxRef?.ref,
    pivotA: [0, 0, 0],        // Crane 上的固定點
    pivotB: [0, -0.6, 0],     // Box 上的固定點（Box 底部）
    axisA: [0, 1, 0],         // Crane 的軸向
    axisB: [0, 1, 0],         // Box 的軸向
  }));

  const handleBind = () => {
    if (!movePlateRef || !boxRef) {
      console.error('Cannot bind: Missing refs');
      return;
    }

    try {
      console.log('Creating fixed constraint...');
      
      // 首先將 box 移動到 crane 上方
      const cranePos = movePlateRef.ref.current.position;
      boxRef.api.position.set(cranePos.x, cranePos.y + 0.6, cranePos.z);
      
      // 減少 box 的重力影響
      boxRef.api.velocity.set(0, 0, 0);
      boxRef.api.angularVelocity.set(0, 0, 0);
      
      // 激活約束
      if (constraintRef.current) {
        constraintRef.current.enable();
      }
      
      console.log('Fixed constraint created successfully');
      
    } catch (error) {
      console.error('Error creating fixed constraint:', error);
    }
  };

  const handleUnbind = () => {
    if (constraintRef.current) {
      constraintRef.current.disable();
    }
  };
    return { handleBind, handleUnbind };
};




// export const useObjectBinding = (craneId, boxId) => {
  
//   const getMoveTableRef = useCraneStore(state => state.getMoveTableRef);
//   const movePlateRef = getMoveTableRef(craneId);
//   const boxRef = useBoxStore(state => state.getBoxRef(boxId));
//   const [isBinding, setIsBinding] = useState(false);

//   const handleBind = () => {
//     if (!movePlateRef || !boxRef || !movePlateRef.api || !boxRef.api) {
//       console.error('Cannot bind: Missing refs or APIs');
//       return;
//     }

//     console.log('Creating direct position binding...');
//     setIsBinding(true);

//     // 方法1: 使用 animation loop 同步位置
//     let animationId;
//     const syncLoop = () => {
//       if (movePlateRef.ref.current && boxRef.ref.current) {
//         const cranePosition = movePlateRef.ref.current.position;
//         const targetPosition = [
//           cranePosition.x,
//           cranePosition.y + 0.6, // Box 在 crane 上方 0.6 單位
//           cranePosition.z
//         ];
        
//         // 設置 box 位置
//         boxRef.api.position.set(...targetPosition);
//         // 也可以設置速度為 0 來避免物理引擎的干擾
//         boxRef.api.velocity.set(0, 0, 0);
//         boxRef.api.angularVelocity.set(0, 0, 0);
        
//         // 設置 box 為運動學模式（kinematic）來避免重力影響
//         boxRef.api.mass.set(0); // 設為 0 質量讓它成為 kinematic body
//       }
      
//       if (isBinding) {
//         animationId = requestAnimationFrame(syncLoop);
//       }
//     };

//     syncLoop();

//     // 清理函數
//     return () => {
//       if (animationId) {
//         cancelAnimationFrame(animationId);
//       }
//       setIsBinding(false);
//       // 恢復 box 的物理屬性
//       if (boxRef.api) {
//         boxRef.api.mass.set(1); // 恢復質量
//       }
//     };
//   };

//   const handleUnbind = () => {
//     setIsBinding(false);
//     if (boxRef.api) {
//       boxRef.api.mass.set(1); // 恢復正常物理行為
//     }
//   };

//   return { handleBind, handleUnbind, isBinding };
// };