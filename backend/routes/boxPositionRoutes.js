const express = require('express');
const router = express.Router();
const { BoxPosition } = require('../models');




// Create
router.post('/', async (req, res) => {
  try {
    const newBoxPosition = await BoxPosition.create(req.body);
    res.status(201).json(newBoxPosition);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const boxPositions = await BoxPosition.findAll();
    res.json(boxPositions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read by ID
router.get('/:id', async (req, res) => {
  try {
    const boxPosition = await BoxPosition.findByPk(req.params.id);
    if (boxPosition) {
      res.json(boxPosition);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update by ID
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await BoxPosition.update(req.body, {
      where: { boxPosition_id: req.params.id },
    });
    if (updated) {
      const updatedBoxPosition = await BoxPosition.findByPk(req.params.id);
      res.json(updatedBoxPosition);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await BoxPosition.destroy({
      where: { boxPosition_id: req.params.id },
    });
    if (deleted) {
      res.json({ message: 'Deleted successfully' });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
