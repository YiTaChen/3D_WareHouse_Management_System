const {Test1} = require('../models');
const express = require('express');
const router = express.Router();




router.get('/', async (req, res) => {
    try {
        const results = await Test1.findAll();
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '查詢失敗' });
    }
});





module.exports = router;
