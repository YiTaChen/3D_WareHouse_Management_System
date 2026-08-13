// ../data/CraneData.js
import { CRANE_CONSTANTS } from '../constants/craneConfig.js';

const fittedCraneConfig = {
  modelPath: '/asrs_stacker_crane_body.glb',
  moveTableModelPath: '/asrs_fork_table.glb',
  bodyColliderSize: [1.7, 0.55, 1.1],
  moveTableColliderSize: [0.86, 0.12, 0.9],
  sensorSize: [0.92, 1, 0.92],
  bindingVerticalOffset: CRANE_CONSTANTS.BOX_BINDING_VERTICAL_OFFSET,
};

export const CraneData ={
  cranes: [
    { id: 'crane001', position: [-1, 0, -6], rotation: [0, 0, 0], movePlateOffset: [0, CRANE_CONSTANTS.COLLECT_PLATE_Y_OFFSET, 0], moveTableInitialPosition: [-1, 1, -6], ...fittedCraneConfig },
    { id: 'crane002', position: [-1, 0, 0], rotation: [0, 0, 0], movePlateOffset: [0, CRANE_CONSTANTS.COLLECT_PLATE_Y_OFFSET, 0], moveTableInitialPosition: [-1, 1, 0], ...fittedCraneConfig },
    { id: 'crane003', position: [-1, 0, 6], rotation: [0, 0, 0], movePlateOffset: [0, CRANE_CONSTANTS.COLLECT_PLATE_Y_OFFSET, 0], moveTableInitialPosition: [-1, 1, 6], ...fittedCraneConfig },

  ]
}

export default CraneData;
