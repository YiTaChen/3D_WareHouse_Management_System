
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



// GET /items/categories - 列出所有不同 category
router.get('/categories', async (req, res) => {
  try {
    const categories = await Item.findAll({
      attributes: ['category'],
      group: ['category'],
    });
    res.json(categories.map(c => c.category));

    // const [results] = await sequelize.query('SELECT DISTINCT category FROM items');
    // res.json(results.map(r => r.category));


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /items/category/:category/ - 根據 category 取得資料
router.get('/category/:category', async (req, res) => {
  try {
    const items = await Item.findAll({
      where: { category: req.params.category }
    });
    res.json(items);

    const category = req.params.category;

    // const [results] = await sequelize.query(
    //   'SELECT * FROM items WHERE category = :category',
    //   {
    //     replacements: { category },
    //   }
    // );

    // res.json(results);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


