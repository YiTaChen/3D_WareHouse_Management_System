
const express = require('express');

const router = express.Router();

const { Box } = require('../models');



// Create
router.post('/', async (req, res) => {
  try {
    const newBox = await Box.create(req.body);
    res.json(newBox);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  const boxes = await Box.findAll();
  res.json(boxes);
});

// Read one
router.get('/:id', async (req, res) => {
  const box = await Box.findByPk(req.params.id);
  if (!box) return res.status(404).json({ error: 'Box not found' });
  res.json(box);
});

// Update
router.put('/:id', async (req, res) => {
  const box = await Box.findByPk(req.params.id);
  if (!box) return res.status(404).json({ error: 'Box not found' });
  await box.update(req.body);
  res.json(box);
});

// Delete
router.delete('/:id', async (req, res) => {
  const box = await Box.findByPk(req.params.id);
  if (!box) return res.status(404).json({ error: 'Box not found' });
  await box.destroy();
  res.json({ message: 'Box deleted' });
});


// only remove the box (soft delete)
router.patch('/:id/remove', async (req, res) => {
  try {
    const [updated] = await Box.update(
      { isRemoved: true },
      { where: { box_id: req.params.id } }
    );

    if (updated) {
      const updatedBox = await Box.findByPk(req.params.id);
      res.json({ message: 'Box removed', data: updatedBox });
    } else {
      res.status(404).json({ error: 'Box not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Soft delete all Boxes (set isRemoved to true for all)
router.patch('/all/remove', async (req, res) => {
  try {
    const [updatedCount] = await Box.update(
      { isRemoved: true },
      { where: {} } // 空的 where 條件表示更新所有記錄
    );
    res.json({ message: `Successfully soft-deleted ${updatedCount} boxes.` });
  } catch (err) {
    console.error("Error soft-deleting all boxes:", err);
    res.status(500).json({ error: 'Failed to soft-delete all boxes.', details: err.message });
  }
});




module.exports = router;



