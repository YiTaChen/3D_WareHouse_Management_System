const { Sequelize } = require('sequelize');
// const Test1Model = require('./test1')



require('dotenv').config();


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


// const Test1 = Test1Model(sequelize, DataTypes);

const Test1 = require('./test1')(sequelize);

const Box = require('./Box')(sequelize);
const Item = require('./Item')(sequelize);
const BoxPosition = require('./BoxPosition')(sequelize);
const BoxContent = require('./BoxContent')(sequelize);


Box.hasOne(BoxPosition, { foreignKey: 'box_id', onDelete: 'CASCADE' });
BoxPosition.belongsTo(Box, { foreignKey: 'box_id' });

Box.hasMany(BoxContent, { foreignKey: 'box_id', onDelete: 'CASCADE' });
BoxContent.belongsTo(Box, { foreignKey: 'box_id' });

Item.hasMany(BoxContent, { foreignKey: 'item_id', onDelete: 'CASCADE' });
BoxContent.belongsTo(Item, { foreignKey: 'item_id' });



module.exports = {
    sequelize,
    Test1   ,
    Box,
    Item,
    BoxPosition,
    BoxContent,

};


