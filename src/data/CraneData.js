// ../data/CraneData.js
import { CRANE_CONSTANTS } from '../constants/craneConfig.js';

const fittedCraneConfig = {
  modelPath: '/asrs_stacker_crane_body.glb',
  moveTableModelPath: '/asrs_fork_table.glb',
  // Preserve the original main-branch physics bodies. The new assets are a
  // visual replacement, not a new movement/collision coordinate system.
  bodyColliderSize: [0.1, 0.1, 0.1],
  moveTableColliderSize: [2, 0.02, 2],
  bindingVerticalOffset: CRANE_CONSTANTS.BOX_BINDING_VERTICAL_OFFSET,
};

export const CraneData ={
  cranes: [
    { id: 'crane001', position: [-1, 3, -6], rotation: [0, 0, 0], movePlateOffset: [0, 1, 0], moveTableInitialPosition: [-1, 3, -6], ...fittedCraneConfig },
    { id: 'crane002', position: [-1, 3, 0], rotation: [0, 0, 0], movePlateOffset: [0, 1, 0], moveTableInitialPosition: [-1, 3, 0], ...fittedCraneConfig },
    { id: 'crane003', position: [-1, 3, 6], rotation: [0, 0, 0], movePlateOffset: [0, 1, 0], moveTableInitialPosition: [-1, 3, 6], ...fittedCraneConfig },

  ]
}

export default CraneData;
