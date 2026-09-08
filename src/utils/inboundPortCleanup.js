import { portConfigs } from '../missions/config/portConfigs.js';

export function boxesAtInboundPort(portId, boxes, getLivePosition, isBound = () => false) {
  const port = portConfigs[portId];
  const spawn = port?.spawnPositions?.inbound;
  if (!spawn) throw new Error('Invalid inbound port');
  return Object.entries(boxes).filter(([id, box]) => {
    if (isBound(id)) return false;
    // Sensors can retain stale equipment IDs after sleeping. Prefer live physics.
    const position = getLivePosition(id) ?? box.position;
    if (!Array.isArray(position) || position.length !== 3 || !position.every(Number.isFinite)) return false;
    // The inlet bed is 2 x 2 m, and boxes are 1 m cubes. Include partial overlap
    // and the vertical drop corridor, but not adjacent beds or boxes on the floor.
    return Math.abs(position[0] - spawn[0]) < 1.5
      && Math.abs(position[2] - spawn[2]) < 1.5
      && position[1] > 1.2 && position[1] <= spawn[1] + .5;
  }).map(([id]) => id);
}

export async function clearInboundPort({ portId, load, localBoxes, getLivePosition, isBound, disable }) {
  const stored = await load();
  const ids = boxesAtInboundPort(portId, { ...stored, ...localBoxes() }, getLivePosition, isBound);
  for (const id of ids) await disable(id);
  return ids;
}
