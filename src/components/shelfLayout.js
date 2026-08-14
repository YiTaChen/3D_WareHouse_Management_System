export function createShelfRows(shelves) {
  const rows = new Map();

  for (const shelf of shelves || []) {
    const [x, y, z] = shelf.position;
    const key = `${y}:${z}:${shelf.rotation.join(':')}`;
    const row = rows.get(key) || { key, y, z, shelves: [] };
    row.shelves.push({ ...shelf, position: [x, y, z] });
    rows.set(key, row);
  }

  return [...rows.values()].map((row) => ({
    ...row,
    shelves: row.shelves.sort((a, b) => a.position[0] - b.position[0]),
  }));
}

export function getShelfRowBody(row, template) {
  const firstShelf = row.shelves[0];
  const lastShelf = row.shelves[row.shelves.length - 1];
  const firstX = firstShelf.position[0];
  const lastX = lastShelf.position[0];

  return {
    position: [
      (firstX + lastX) / 2 + template.position[0],
      row.y + template.position[1],
      row.z + template.position[2],
    ],
    rotation: template.rotation,
    args: [
      lastX - firstX + template.args[0],
      template.args[1],
      template.args[2],
    ],
  };
}

export function getNearestShelfInRow(row, boxX) {
  return row.shelves.reduce((nearest, shelf) => (
    Math.abs(shelf.position[0] - boxX) < Math.abs(nearest.position[0] - boxX)
      ? shelf
      : nearest
  ));
}
