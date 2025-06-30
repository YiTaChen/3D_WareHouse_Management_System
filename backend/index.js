require('dotenv').config();

const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = process.env.PORT || 3002;

// 用 dotenv 讀取設定
const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    dialect: 'postgres',
    port: process.env.PG_PORT,
    logging: false,
  }
);


const Test1 = sequelize.define('Test1', {
  name: {
    type: DataTypes.TEXT,
  },
  age: {
    type: DataTypes.INTEGER,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
}, {
  tableName: 'test1',
  timestamps: false,
});

//initialize database connection and sync model
async function initDb() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL 連線成功');
    await Test1.sync();
    console.log('test1 資料表同步完成');
  } catch (error) {
    console.error('資料庫連線或同步失敗:', error);
  }
}

// REST API 取得 test1 所有資料
app.get('/test1', async (req, res) => {
  try {
    const results = await Test1.findAll();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '查詢失敗' });
  }
});

app.get('/', (req, res) => {
  res.send('Server is working!');
});

app.listen(port, async () => {
  console.log(`Express server 啟動於 port ${port}`);
  await initDb();
});
