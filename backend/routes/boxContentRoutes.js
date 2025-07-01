const express = require('express');
const router = express.Router();
const { BoxContent } = require('../models');



// Create
router.post('/', async (req, res) => {
  try {
    const newBoxContent = await BoxContent.create(req.body);
    res.status(201).json(newBoxContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const boxContents = await BoxContent.findAll();
    res.json(boxContents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read by ID
router.get('/:id', async (req, res) => {
  try {
    const boxContent = await BoxContent.findByPk(req.params.id);
    if (boxContent) {
      res.json(boxContent);
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
    const [updated] = await BoxContent.update(req.body, {
      where: { boxContent_id: req.params.id },
    });
    if (updated) {
      const updatedBoxContent = await BoxContent.findByPk(req.params.id);
      res.json(updatedBoxContent);
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
    const deleted = await BoxContent.destroy({
      where: { boxContent_id: req.params.id },
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