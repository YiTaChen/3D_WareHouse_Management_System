// A private, in-memory demo API for one page session. Never writes to the hosted database.
export const createDemoApi = ({ products = [], maxBoxes = 1000 } = {}) => {
  const boxes = new Map();
  const positions = new Map();
  const contents = new Map();
  let nextContentId = 1;
  const reply = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
  const notFound = () => reply({ error: 'Not found' }, 404);
  const fullBox = box => {
    const content = Object.create(null);
    for (const entry of contents.values()) {
      if (entry.box_id !== box.box_id || entry.isContentDelete) continue;
      const item = products.find(product => product.item_id === entry.item_id);
      content[entry.item_id] = { id: entry.item_id, name: item?.item_name || '',
        category: item?.category || '', quantity: entry.quantity };
    }
    if (!Object.keys(content).length) content.empty = { id: 'empty', name: 'empty box', category: 'N/A', quantity: 0 };
    const position = positions.get(box.box_id);
    return { id: box.box_id, position: position ? [position.position_x, position.position_y, position.position_z] : [0, 0, 0],
      content, isRemoved: box.isRemoved };
  };
  const activeBoxes = () => [...boxes.values()].filter(box => !box.isRemoved);
  return async (input, init = {}) => {
    const path = new URL(String(input), 'https://demo.invalid').pathname;
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const method = (init.method || 'GET').toUpperCase();
    let body = {};
    try { if (init.body) body = JSON.parse(init.body); }
    catch { return reply({ error: 'Invalid JSON' }, 400); }
    if (method === 'GET') {
      if (path === '/items') return reply(products);
      if (path === '/items/categories') return reply([...new Set(products.map(item => item.category))]);
      if (path === '/boxPositions/mapFullData' || path === '/boxPositions/map') {
        return reply(Object.fromEntries(activeBoxes().map(box => [box.box_id, fullBox(box)])));
      }
      if (path === '/boxInventory/fullData') return reply(activeBoxes().map(fullBox));
      if (parts[0] === 'boxInventory' && parts[2] === 'full') {
        const box = boxes.get(parts[1]); return box ? reply(fullBox(box)) : notFound();
      }
      if (path === '/boxes') return reply([...boxes.values()]);
    }
    if (path === '/boxes' && method === 'POST') {
      if (typeof body.box_id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(body.box_id)) return reply({ error: 'Invalid box ID' }, 400);
      if (boxes.has(body.box_id)) return reply({ error: 'Box already exists' }, 409);
      if (boxes.size >= maxBoxes) return reply({ error: 'Demo box limit reached. Reload to start again.' }, 429);
      const box = { box_id: body.box_id, isRemoved: false };
      boxes.set(body.box_id, box); return reply(box, 201);
    }
    if (parts[0] === 'boxes' && parts[2] === 'remove' && method === 'PATCH') {
      if (parts[1] === 'all') { for (const box of boxes.values()) box.isRemoved = true; return reply({ message: 'Boxes removed' }); }
      const box = boxes.get(parts[1]); if (!box) return notFound();
      box.isRemoved = true; return reply({ message: 'Box removed', data: box });
    }
    if (parts[0] === 'boxPositions' && parts[1] === 'box' && ['POST', 'PATCH'].includes(method)) {
      if (!boxes.has(parts[2])) return notFound();
      if (!['position_x', 'position_y', 'position_z'].every(key => typeof body[key] === 'number' && Number.isFinite(body[key]))) return reply({ error: 'Invalid position' }, 400);
      const position = { box_id: parts[2], position_x: body.position_x, position_y: body.position_y, position_z: body.position_z };
      positions.set(parts[2], position); return reply(position, method === 'POST' ? 201 : 200);
    }
    if (path === '/boxContents' && method === 'POST') {
      if (!boxes.has(body.box_id) || !products.some(item => item.item_id === body.item_id)) return notFound();
      if (!Number.isSafeInteger(body.quantity) || body.quantity < 0) return reply({ error: 'Invalid quantity' }, 400);
      const id = nextContentId++;
      const content = { boxContent_id: id, box_id: body.box_id, item_id: body.item_id,
        quantity: body.quantity, isContentDelete: false };
      contents.set(id, content); return reply(content, 201);
    }
    return notFound();
  };
};
