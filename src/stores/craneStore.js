import { create } from 'zustand';
import * as THREE from 'three';
import CraneData from '../data/CraneData'; 




// const { scene: fullCraneScene } = useGLTF('/Crane_ver1.gltf');

// const moveTableMesh = useMemo(() => {
//         let mesh = null;
//         fullCraneScene.traverse((obj) => {
//         if (obj.name === 'movePlate') {
//             mesh = obj.clone();
//             if (mesh.material) {
//             mesh.material.transparent = true;
//             mesh.material.opacity = 0.5;
//             mesh.material.needsUpdate = true;
//             }
//             mesh.traverse((child) => {
//             if (child.isMesh && child.material) {
//                 child.material = child.material.clone();
//                 child.material.transparent = true;
//                 child.material.opacity = 0.2;
//                 child.material.needsUpdate = true;
//             }
//             });
//         }
//         });
//         return mesh;
//     }, [fullCraneScene]);


//  const moveTableLocalProps = useMemo(() => {
        
        
//         if (moveTableMesh) {
//             console.log('moveTableMesh:', moveTableMesh.position);
//             console.log(craneWorldPosition)

//         return {
            
//             position: moveTableMesh.position.toArray(), // 獲取本地位置
//             // position: [0, 1, 0], // 預設值

//             rotation: moveTableMesh.rotation.toArray(), // 獲取本地旋轉
//             args: getLocalBoundingBoxSize(moveTableMesh), // 獲取本地尺寸
//         };
//         }
//         console.warn('moveTableMesh is not available, using default props');
//         return { position: [0,0,0], rotation: [0,0,0], args: [2, 1, 2] }; // 預設值
//     }, [moveTableMesh]);


// Helper function to create default crane state
const getDefaultCraneState = () => ({
  BulkSensorDetected: false,
  currentCranePosition: new THREE.Vector3(0, 3, -10), // Fallback if data is missing
  targetCranePosition: new THREE.Vector3(0, 3, -10),
  craneMoveSpeed: 1,

  rotation: new THREE.Euler(...craneConfig.rotation), 
      
  currentMoveTableLocalOffset: new THREE.Vector3(0, 1, 0), // Fallback if data is missing
  targetMoveTableLocalOffset: new THREE.Vector3(0, 1, 0),
  moveTableSpeed: 1,
  isCraneMoving: false,
  isMoveTableMoving: false,
  moveTableRef: null
});

const initializeCraneStates = () => {
  const craneStates = {};
  
  CraneData.cranes.forEach(craneConfig => {
    // Basic validation to ensure necessary properties exist
    if (!craneConfig.id || !craneConfig.position || !craneConfig.rotation || !craneConfig.movePlateOffset) {
      console.warn(`Skipping invalid crane configuration:`, craneConfig);
      return;
    }

    craneStates[craneConfig.id] = {
      BulkSensorDetected: false,
      
      // Crane 整體移動相關狀態 - 從 CraneData 初始化
      currentCranePosition: new THREE.Vector3(...craneConfig.position), // <--- 使用 CraneData 的 position
      targetCranePosition: new THREE.Vector3(...craneConfig.position),  // <--- 目標也初始化為相同位置
      craneMoveSpeed: 1,

      rotation: new THREE.Euler(...craneConfig.rotation), 

      // moveTable 移動相關狀態 - 從 CraneData 的 movePlateOffset 初始化
      currentMoveTableLocalOffset: new THREE.Vector3(...craneConfig.movePlateOffset), // <--- 使用 CraneData 的 movePlateOffset
      targetMoveTableLocalOffset: new THREE.Vector3(...craneConfig.movePlateOffset), // <--- 目標也初始化為相同偏移
      moveTableSpeed: 1,

      isCraneMoving: false,
      isMoveTableMoving: false,
      moveTableRef: null
    };
    console.log(`[craneStore.js] Initializing crane ${craneConfig.id} with currentCranePosition:`, craneStates[craneConfig.id].currentCranePosition.toArray());
  });
  return craneStates;
};

export const useCraneStore = create((set, get) => ({
  craneStates: initializeCraneStates(),
  craneRefs: {}, // This might not be needed if Crane.jsx directly uses its ref

  setCraneRef: (id, ref) => {
    // This action might not be fully utilized with the new ref binding
    set((state) => ({
      craneRefs: {
        ...state.craneRefs,
        [id]: ref
      }
    }));
  },

  setMoveTableRef: (craneId, moveTableData) => set((state) => {
    const updatedCraneStates = { ...state.craneStates };
    
    if (!updatedCraneStates[craneId]) {
      updatedCraneStates[craneId] = { ...getDefaultCraneState() }; // Fallback
    }
    
    updatedCraneStates[craneId].moveTableRef = moveTableData;
    
    if (moveTableData) {
      console.log(`Store: MoveTable ${craneId} ref set`, {
        hasRef: !!moveTableData.ref?.current,
        hasApi: !!moveTableData.api,
        isReady: moveTableData.isReady
      });
    }
    
    return { craneStates: updatedCraneStates };
  }),

  getMoveTableApi: (craneId) => {
    const state = get();
    const craneState = state.craneStates[craneId];
    if (!craneState?.moveTableRef?.api || !craneState.moveTableRef.isReady) {
      console.warn(`MoveTable API not ready or not found for crane ${craneId}`);
      return null;
    }
    return craneState.moveTableRef.api;
  },

  isMoveTableReady: (craneId) => {
    const state = get();
    const craneState = state.craneStates[craneId];
    return craneState?.moveTableRef?.isReady || false;
  },

  getMoveTableRef: (craneId) => {
    const state = get();
    const craneState = state.craneStates[craneId];
    return craneState?.moveTableRef || null;
  },

  setCraneSensorDetected: (id, sensorKey, detected) => {
    set((state) => ({
      craneStates: {
        ...state.craneStates,
        [id]: {
          ...state.craneStates[id],
          [sensorKey]: detected,
        },
      },
    }));
  },

  setMoveTableMesh: (id, mesh) => set(state => ({
    cranes: {
      ...state.craneStates,
      [id]: {
        ...state.craneStates[id],
        moveTableMesh: mesh, // 儲存 mesh 物件
      },
    },
  })),

  getCraneState: (id) => get().craneStates[id],

  setCraneTargetPosition: (id, targetPosition, speed) => {
    set((state) => {
      const craneState = state.craneStates[id];
      if (!craneState) {
        console.warn(`Crane ${id} not found in store.`);
        return {};
      }
      if (craneState.isMoveTableMoving) {
        console.warn(`Crane ${id}: Cannot move crane while moveTable is in motion.`);
        return {};
      }

      const newTargetPos = new THREE.Vector3(...targetPosition);
      const newSpeed = speed > 0 ? speed : craneState.craneMoveSpeed;

      return {
        craneStates: {
          ...state.craneStates,
          [id]: {
            ...craneState,
            targetCranePosition: newTargetPos,
            craneMoveSpeed: newSpeed,
            isCraneMoving: !craneState.currentCranePosition.equals(newTargetPos),
          },
        },
      };
    });
  },

  updateCraneCurrentPosition: (id, currentPositionArray) => {
    set((state) => {
      const craneState = state.craneStates[id];
      if (!craneState) return {};

      const newCurrentPos = new THREE.Vector3(...currentPositionArray);
      // 只有當新位置與舊位置不完全相等時才更新
      // 這是避免無限渲染的關鍵，因為即使是物理引擎的微小浮點數變化，
      // 如果每次都導致 store 更新，就會導致重新渲染。
      if (newCurrentPos.equals(craneState.currentCranePosition)) {
          // 如果位置沒有實質性變化，則不觸發 store 更新
          return {}; 
      }

      const isMoving = !newCurrentPos.equals(craneState.targetCranePosition);

      return {
        craneStates: {
          ...state.craneStates,
          [id]: {
            ...craneState,
            currentCranePosition: newCurrentPos,
            isCraneMoving: isMoving,
          },
        },
      };
    });
  },

  updateMoveTableCurrentLocalOffset: (id, currentOffset) => {
    set((state) => {
      const craneState = state.craneStates[id];
      if (!craneState) return {};

      const newCurrentOffset = new THREE.Vector3(...currentOffset);
      // isMoving 判斷：當前偏移與目標偏移不一致時為 true
      const isMoving = !newCurrentOffset.equals(craneState.targetMoveTableLocalOffset);

      return {
        craneStates: {
          ...state.craneStates,
          [id]: {
            ...craneState,
            currentMoveTableLocalOffset: newCurrentOffset,
            isMoveTableMoving: isMoving, // <-- 這裡更新 isMoveTableMoving
          },
        },
      };
    });
  },

  setMoveTableTargetLocalOffset: (id, relativeOffset, speed) => {
    set((state) => {
      const craneState = state.craneStates[id];
      if (!craneState) {
        console.warn(`Crane ${id} not found in store.`);
        return {};
      }
      if (craneState.isCraneMoving) {
        console.warn(`Crane ${id}: Cannot move moveTable while crane is in motion.`);
        return {};
      }

      const craneConfig = CraneData.cranes.find(c => c.id === id);
      if (!craneConfig) {
        console.warn(`Crane config not found for ${id}`);
        return {};
      }
      
      const initialBaseOffset = new THREE.Vector3(...craneConfig.movePlateOffset);
      const finalAbsoluteTargetOffset = initialBaseOffset.clone().add(new THREE.Vector3(...relativeOffset));

      const newSpeed = speed > 0 ? speed : craneState.moveTableSpeed;

      return {
        craneStates: {
          ...state.craneStates,
          [id]: {
            ...craneState,
            targetMoveTableLocalOffset: finalAbsoluteTargetOffset,
            moveTableSpeed: newSpeed,
            isMoveTableMoving: !craneState.currentMoveTableLocalOffset.equals(finalAbsoluteTargetOffset),
          },
        },
      };
    });
  },

}));