const reserved = new Set(['__proto__', 'prototype', 'constructor']);
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(value) && !reserved.has(value);
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
const coordinate = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 10000;
const quantity = value => Number.isSafeInteger(value) && value >= 0 && value <= 1000000;
const boolean = value => typeof value === 'boolean';
const position = { position_x: coordinate, position_y: coordinate, position_z: coordinate };

const validateRequest = (req, res, next) => {
  const reject = () => res.status(400).json({ error: 'Invalid request data.' });
  const parts = req.path.split('/').filter(Boolean);
  if (parts.some(part => part.length > 200 || reserved.has(part))) return reject();
  if (['GET', 'HEAD', 'OPTIONS', 'DELETE'].includes(req.method) || parts[0] === 'db') return next();
  const body = req.body === undefined && parts.at(-1) === 'remove' ? {} : req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reject();
  let fields;
  let required = [];
  if (parts[0] === 'boxes') {
    fields = parts.at(-1) === 'remove' ? { box_id: identifier } : { box_id: identifier, isRemoved: boolean };
    if (req.method === 'POST') required = ['box_id'];
    if (req.method === 'PUT') fields = { isRemoved: boolean };
  } else if (parts[0] === 'items') {
    fields = { item_id: identifier, item_name: text, category: text };
    if (req.method === 'POST') required = ['item_id', 'item_name'];
    if (req.method === 'PUT') fields = { item_name: text, category: text };
  } else if (parts[0] === 'boxPositions') {
    fields = parts[1] === 'box' ? position : { box_id: identifier, ...position };
    if (req.method === 'POST') required = parts[1] === 'box' ? Object.keys(position) : ['box_id', ...Object.keys(position)];
    if (req.method === 'PUT') fields = position;
  } else if (parts[0] === 'boxContents') {
    fields = { box_id: identifier, item_id: identifier, quantity, isContentDelete: boolean };
    if (req.method === 'POST') required = ['box_id', 'item_id', 'quantity'];
    if (req.method === 'PUT') fields = { quantity, isContentDelete: boolean };
  } else if (parts[0] === 'boxInventory') {
    fields = parts[2] === 'position' ? { x: coordinate, y: coordinate, z: coordinate } : { quantity, isContentDelete: boolean };
    if (parts[2] === 'position') required = ['x', 'y', 'z'];
  } else return reject();
  if (Object.keys(body).some(key => !Object.hasOwn(fields, key) || !fields[key](body[key]))) return reject();
  if (required.some(key => !Object.hasOwn(body, key))) return reject();
  if (!Object.keys(body).length && parts.at(-1) !== 'remove') return reject();
  next();
};
module.exports = { validateRequest, identifier };
