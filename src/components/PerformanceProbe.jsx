import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export default function PerformanceProbe({ enabled }) {
  const gl = useThree((state) => state.gl);
  const sampleRef = useRef({
    startedAt: performance.now(),
    frames: 0,
    maxFrameGapMs: 0,
  });

  useFrame((_, delta) => {
    if (!enabled) return;

    const sample = sampleRef.current;
    const now = performance.now();
    sample.frames += 1;
    sample.maxFrameGapMs = Math.max(sample.maxFrameGapMs, delta * 1000);

    const elapsedMs = now - sample.startedAt;
    if (elapsedMs < 1000) return;

    document.documentElement.dataset.warehousePerf = JSON.stringify({
      fps: (sample.frames * 1000) / elapsedMs,
      maxFrameGapMs: sample.maxFrameGapMs,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      sampledAt: Date.now(),
    });

    sample.startedAt = now;
    sample.frames = 0;
    sample.maxFrameGapMs = 0;
  });

  return null;
}
