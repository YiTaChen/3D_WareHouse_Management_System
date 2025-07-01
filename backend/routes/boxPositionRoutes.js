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


// GET /box/:boxId - 根據 box_id 取得對應的 BoxPosition
router.get('/box/:boxId', async (req, res) => {
  try {
    const position = await BoxPosition.findOne({
      where: { box_id: req.params.boxId },
    });
    if (position) {
      res.json(position);
    } else {
      res.status(404).json({ error: 'BoxPosition not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /box/:boxId - 為特定 box_id 建立位置資料
router.post('/box/:boxId', async (req, res) => {
  try {
    const { position_x, position_y, position_z } = req.body;

    // check if box_id is exists, then return error
    const existing = await BoxPosition.findOne({
      where: { box_id: req.params.boxId },
    });

    if (existing) {
      return res.status(400).json({
        error: `BoxPosition for box_id "${req.params.boxId}" already exists`,
      });
    }

    const newPosition = await BoxPosition.create({
      box_id: req.params.boxId,
      position_x,
      position_y,
      position_z,
    });
    res.status(201).json(newPosition);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// // PUT /box/:boxId - 替換某個 box 的位置
// router.put('/box/:boxId', async (req, res) => {
//   try {
//     const [updated] = await BoxPosition.update(req.body, {
//       where: { box_id: req.params.boxId },
//     });
//     if (updated) {
//       const updatedPosition = await BoxPosition.findOne({
//         where: { box_id: req.params.boxId },
//       });
//       res.json(updatedPosition);
//     } else {
//       res.status(404).json({ error: 'BoxPosition not found' });
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// PATCH /box/:boxId - 僅更新 position_x, position_y, position_z 任一欄位
router.patch('/box/:boxId', async (req, res) => {
  try {
    const { position_x, position_y, position_z } = req.body;
    const [updated] = await BoxPosition.update(
      { position_x, position_y, position_z },
      { where: { box_id: req.params.boxId } }
    );
    if (updated) {
      const updatedPosition = await BoxPosition.findOne({
        where: { box_id: req.params.boxId },
      });
      res.json(updatedPosition);
    } else {
      res.status(404).json({ error: 'BoxPosition not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
