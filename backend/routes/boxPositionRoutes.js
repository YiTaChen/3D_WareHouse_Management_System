const express = require('express');
const router = express.Router();
const { Box, BoxPosition, BoxContent, Item } = require('../models');




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

// boxPositions/map
router.get('/map', async (req, res) => {
  try {
    const all = await BoxPosition.findAll(
      {
          include: {
            model: Box,
            where: { isRemoved: false }, 
            attributes: [], // 不需要回傳 box 的欄位，只作為過濾
            required: true
          }
      }
    );
    const map = {};
    all.forEach(p => {
      map[p.box_id] = {
        id: p.box_id,
        position: [p.position_x, p.position_y, p.position_z],
      };
    });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /mapFullData - Get complete data for all Boxes in a map format
router.get('/mapFullData', async (req, res) => {
  try {
    const boxes = await Box.findAll({
      where: { isRemoved: false }, // Only get boxes that are not soft-deleted
      include: [
        {
          model: BoxPosition,
          // required: true, // You can make this true if a box must always have a position
        },
        {
          model: BoxContent,
          where: { isContentDelete: false },
          required: false, // LEFT JOIN for box content
          include: [
            {
              model: Item,
              required: false, // LEFT JOIN for item details
            },
          ],
        },
      ],
    });

    const mapFullData = {}; // Initialize an empty object to store the mapped data

    boxes.forEach(box => {
      const boxData = {
        id: box.box_id,
        position: box.BoxPosition
          ? [box.BoxPosition.position_x, box.BoxPosition.position_y, box.BoxPosition.position_z]
          : [0, 0, 0], // Default position if not found
        content: {}, // Initialize content for this box
      };

      if (box.BoxContents && box.BoxContents.length > 0) {
        for (const content of box.BoxContents) {
          boxData.content[content.item_id] = {
            id: content.item_id,
            name: content.Item?.item_name || '',
            category: content.Item?.category || '',
            quantity: content.quantity,
          };
        }
      } else {
        // If the box has no content, represent it as an "empty box"
        boxData.content = {
          empty: {
            id: 'empty',
            name: 'empty box',
            category: 'N/A',
            quantity: 0,
          },
        };
      }
      
      // Add the constructed boxData to the map using box_id as the key
      mapFullData[box.box_id] = boxData;
    });

    res.json(mapFullData); // Return the mapped object
  } catch (err) {
    console.error("Error fetching all full box data in map format:", err);
    res.status(500).json({ error: 'Failed to retrieve all full box data in map format', details: err.message });
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
