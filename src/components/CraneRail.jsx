import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { CRANE_CONSTANTS } from '../constants/craneConfig.js';

export default function CraneRail({ laneZ }) {
  const { scene } = useGLTF('/asrs_ground_rail_4m.glb');
  const segments = useMemo(
    () => CRANE_CONSTANTS.RAIL_SEGMENT_CENTERS.map(
      (x) => ({ x, object: scene.clone(true) })
    ),
    [scene]
  );

  return (
    <group
      position={[0, 0, laneZ]}
      userData={{ segmentLength: CRANE_CONSTANTS.RAIL_SEGMENT_LENGTH }}
    >
      {segments.map(({ x, object }) => (
        <primitive key={x} object={object} position={[x, 0, 0]} />
      ))}
    </group>
  );
}
