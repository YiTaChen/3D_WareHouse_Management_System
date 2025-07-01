require('dotenv').config();

const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = process.env.PORT || process.env.PORT_LOCAL || 3002;


let dbConfig = {};

if (process.env.DB_ENV === 'local') {
        dbConfig = {
            host: process.env.PG_HOST_LOCAL,
            port: process.env.PG_PORT_LOCAL,
            database: process.env.PG_DATABASE_LOCAL,
            username: process.env.PG_USER_LOCAL,
            password: process.env.PG_PASSWORD_LOCAL,
            dialect: process.env.PG_DIALECT_LOCAL || 'postgres',
    };

    } 
    else if (process.env.DB_ENV === 'cloud') 
    {
        dbConfig = {
            host: process.env.PG_HOST,
            port: process.env.PG_PORT,
            database: process.env.PG_DATABASE,
            username: process.env.PG_USER,
            password: process.env.PG_PASSWORD,
            dialect: process.env.PG_DIALECT || 'postgres',
        }
    }
    else {
    throw new Error('find no DB_ENV setting matched,  pls check .env setting');
    }


// 用 Sequelize 連接 PostgreSQL 資料庫
const sequelize = new Sequelize(
  dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
    host: dbConfig.host,
    port: dbConfig.port,
    logging: false,
    dialect: dbConfig.dialect,
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
