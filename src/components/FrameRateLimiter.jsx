import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export default function FrameRateLimiter({ fps = 30 }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const frameInterval = 1000 / fps;
    let previousTime = performance.now();
    let animationFrameId;

    const tick = (currentTime) => {
      animationFrameId = requestAnimationFrame(tick);

      if (document.hidden || currentTime - previousTime < frameInterval) {
        return;
      }

      previousTime = currentTime - ((currentTime - previousTime) % frameInterval);
      invalidate();
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [fps, invalidate]);

  return null;
}
