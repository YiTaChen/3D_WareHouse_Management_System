const express = require('express');
const router = express.Router();
const { Box, BoxPosition, BoxContent, Item } = require('../models');

// 1. 回傳特定 Box 完整資料 (position + content)
router.get('/:boxId/full', async (req, res) => {
  try {
    const { boxId } = req.params;

    // Use findByPk to get the box by its primary key
    const box = await Box.findByPk(boxId, {
      include: [
        {
          model: BoxPosition, // Inner Join implied by default for direct model association if not specified
          // required: true, // You can explicitly set this to true if you always expect a position
        },
        {
          model: BoxContent,
          where: { isContentDelete: false }, // Filter out soft-deleted content
          required: false, // This is crucial for LEFT JOIN behavior
          include: [
            {
              model: Item,
              required: false, // Make this a LEFT JOIN too, in case item_id is NULL or invalid
            },
          ],
        },
      ],
    });

    if (!box) {
      return res.status(404).json({ error: 'Box not found' });
    }

    const boxData = {
      id: box.box_id,
      // Ensure position is always an array, even if BoxPosition is null
      position: box.BoxPosition
        ? [box.BoxPosition.position_x, box.BoxPosition.position_y, box.BoxPosition.position_z]
        : [0, 0, 0], // Default position if not found (though usually a Box has a position)
      content: {}, // Initialize content as an empty object
      isRemoved: box.isRemoved, // Include the isRemoved status
    };

    // Check if there are any active box contents
    if (box.BoxContents && box.BoxContents.length > 0) {
      // If content exists, populate the 'content' object
      for (const content of box.BoxContents) {
        // Use a unique key for each item in the content object, typically the item_id
        boxData.content[content.item_id] = {
          id: content.item_id,
          // If Item is null (due to LEFT JOIN and no matching item_id), name will be empty string
          name: content.Item?.item_name || '',
          category: content.Item?.category || '',
          quantity: content.quantity,
        };
      }
    } else {
      // If there are no BoxContents (empty box)
      boxData.content = {
        // Use a generic key like 'empty' or the box_id if you prefer
        // This makes it clear it's an empty box representation
        empty: {
          id: 'empty', // A specific ID for the 'empty' state
          name: 'empty box',
          category: 'N/A', // No category for an empty box
          quantity: 0, // Quantity is 0 for an empty box
        },
      };
    }

    res.json(boxData);
  } catch (err) {
    console.error(`Error fetching full box data for ID ${req.params.boxId}:`, err);
    res.status(500).json({ error: 'Failed to retrieve full box data', details: err.message });
  }
});


// GET /fullData - Get complete data for all Boxes
router.get('/fullData', async (req, res) => {
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

    const allBoxesData = boxes.map(box => {
      const boxData = {
        id: box.box_id,
        position: box.BoxPosition
          ? [box.BoxPosition.position_x, box.BoxPosition.position_y, box.BoxPosition.position_z]
          : [0, 0, 0], // Default position
        content: {},
        isRemoved: box.isRemoved,
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
      return boxData;
    });

    res.json(allBoxesData);
  } catch (err) {
    console.error("Error fetching all full box data:", err);
    res.status(500).json({ error: 'Failed to retrieve all full box data', details: err.message });
  }
});






// 2. 更新 BoxPosition (by box_id)
router.put('/:boxId/position', async (req, res) => {
  try {
    const { boxId } = req.params;
    const { x, y, z } = req.body;

    let pos = await BoxPosition.findOne({ where: { box_id: boxId } });

    if (pos) {
      await pos.update({ position_x: x, position_y: y, position_z: z });
    } else {
      await BoxPosition.create({ box_id: boxId, position_x: x, position_y: y, position_z: z });
    }

    res.json({ message: '位置更新完成' });
  } catch (err) {
    res.status(500).json({ error: '更新失敗' });
  }
});

// 3. 更新 BoxContent (by box_id + item_id)
router.put('/:boxId/content/:itemId', async (req, res) => {
  try {
    const { boxId, itemId } = req.params;
    const { quantity, isContentDelete } = req.body;

    const content = await BoxContent.findOne({ where: { box_id: boxId, item_id: itemId } });

    if (!content) return res.status(404).json({ error: 'Content not found' });

    await content.update({ quantity, isContentDelete });

    res.json({ message: '內容更新成功' });
  } catch (err) {
    res.status(500).json({ error: '更新失敗' });
  }
});

module.exports = router;




