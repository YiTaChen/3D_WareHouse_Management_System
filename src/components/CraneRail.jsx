import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

const RAIL_SEGMENT_LENGTH = 4;
const RAIL_CENTERS = [-4, 0, 4, 8, 12];

export default function CraneRail({ laneZ }) {
  const { scene } = useGLTF('/asrs_ground_rail_4m.glb');
  const segments = useMemo(
    () => RAIL_CENTERS.map((x) => ({ x, object: scene.clone(true) })),
    [scene]
  );

  return (
    <group position={[0, 0, laneZ]} userData={{ segmentLength: RAIL_SEGMENT_LENGTH }}>
      {segments.map(({ x, object }) => (
        <primitive key={x} object={object} position={[x, 0, 0]} />
      ))}
    </group>
  );
}
