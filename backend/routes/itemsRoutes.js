
const express = require('express');

const router = express.Router();

const { Item } = require('../models');


// Create
router.post('/', async (req, res) => {
  try {
    const newItem = await Item.create(req.body);
    res.json(newItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  const items = await Item.findAll();
  res.json(items);
});

// Read one
router.get('/:id', async (req, res) => {
  const item = await Item.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// Update
router.put('/:id', async (req, res) => {
  const item = await Item.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  await item.update(req.body);
  res.json(item);
});

// Delete
router.delete('/:id', async (req, res) => {
  const item = await Item.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  await item.destroy();
  res.json({ message: 'Item deleted' });
});

module.exports = router;


