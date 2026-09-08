// Box.jsx creates axis-aligned 1 m cubes from persisted center positions.
// Ignore up to 2 cm of contact penetration to preserve touching/stacked boxes.
const OVERLAP_DISTANCE = 1 - 0.02;
const validPosition = p => Array.isArray(p) && p.length === 3
  && p.every(n => typeof n === 'number' && Number.isFinite(n));

export function planBoxLoadCleanup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid box data response');
  }
  const boxesData = {};
  const removed = [];
  // Code-point order is identical across clients, independent of API row order.
  for (const id of Object.keys(data).sort()) {
    const box = data[id];
    const overlap = validPosition(box?.position) && Object.keys(boxesData).find(keptId => {
      const other = boxesData[keptId];
      return validPosition(other?.position) && box.position.every((n, axis) =>
        Math.abs(n - other.position[axis]) < OVERLAP_DISTANCE);
    });
    if (overlap) removed.push({ id, keptId: overlap });
    else boxesData[id] = box;
  }
  return { boxesData, removed };
}

// Single-flight startup prevents React StrictMode from running cleanup twice.
// Commit only the filtered map, after all soft-delete requests have settled.
export function createBoxDataLoader({ fetchMap, removeBox, commit }) {
  let inFlight;
  return () => {
    if (inFlight) return inFlight;
    inFlight = Promise.resolve().then(async () => {
      const plan = planBoxLoadCleanup(await fetchMap());
      const failedIds = [];
      for (const { id } of plan.removed) {
        try { await removeBox(id); }
        catch { failedIds.push(id); }
      }
      // Failed removals remain excluded locally, and retry on the next load.
      const result = { ...plan, failedIds };
      commit(result);
      return result;
    }).finally(() => { inFlight = undefined; });
    return inFlight;
  };
}
