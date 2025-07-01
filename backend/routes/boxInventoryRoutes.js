const express = require('express');
const router = express.Router();
const { Box, BoxPosition, BoxContent, Item } = require('../models');

// 1. 回傳特定 Box 完整資料 (position + content)
router.get('/:boxId/full', async (req, res) => {
  try {
    const { boxId } = req.params;

    const box = await Box.findByPk(boxId, {
      include: [
        { model: BoxPosition },
        {
          model: BoxContent,
          where: { isContentDelete: false },
          required: false,
          include: [Item],
        }
      ],
    });

    if (!box) return res.status(404).json({ error: 'Box not found' });

    const json = {
      id: box.box_id,
      position: box.BoxPosition
        ? [box.BoxPosition.position_x, box.BoxPosition.position_y, box.BoxPosition.position_z]
        : [],
      content: {},
    };

    for (const content of box.BoxContents) {
      json.content[content.item_id] = {
        id: content.item_id,
        name: content.Item?.item_name || '',
        content: content.Item?.category || '',
        quantity: content.quantity,
      };
    }

    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '查詢失敗' });
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




