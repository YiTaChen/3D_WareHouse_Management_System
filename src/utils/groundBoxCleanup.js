export const GROUND_BOX_DELAY_MS = 6000;

// Driven by actual ground contacts, not height or conveyor/shelf sensors.
export function createGroundBoxMonitor({ isEligible, disable, schedule = setTimeout, cancel = clearTimeout, onError = console.warn }) {
  let touching = false, disposed = false, timer = null, pending = false;
  const arm = () => {
    if (!touching || disposed || pending || timer !== null) return;
    timer = schedule(async () => {
      timer = null;
      if (!touching || disposed) return;
      if (!isEligible()) { arm(); return; }
      pending = true;
      let disabled = false;
      try { await disable(); disabled = true; }
      catch (error) { onError('Ground box cleanup will retry:', error); }
      finally { pending = false; }
      if (!disabled) arm();
    }, GROUND_BOX_DELAY_MS);
  };
  const stop = () => { if (timer !== null) cancel(timer); timer = null; };
  return {
    enter() { touching = true; arm(); },
    leave() { touching = false; stop(); },
    dispose() { disposed = true; touching = false; stop(); },
  };
}

// Lowest point of a rotated 1 m cube, allowing 4 cm of solver jitter.
export function isAboveGround(position, quaternion) {
  const [x, y, z, w] = quaternion;
  const halfHeight = (Math.abs(2 * (x * y + z * w)) + Math.abs(1 - 2 * (x * x + z * z)) + Math.abs(2 * (y * z - x * w))) / 2;
  return position[1] - halfHeight > 0.04;
}
