const { Sequelize } = require('sequelize');
const path = require('path');
// const Test1Model = require('./test1')



require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


let dbConfig = {};
const dbEnv = process.env.DB_ENV || 'local';

const envOrDefault = (name, fallback) =>
    process.env[name] !== undefined ? process.env[name] : fallback;

const requireEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

if (dbEnv === 'local') {
        dbConfig = {
            host: envOrDefault('PG_HOST_LOCAL', 'localhost'),
            port: envOrDefault('PG_PORT_LOCAL', 5432),
            database: envOrDefault('PG_DATABASE_LOCAL', 'warehouse_dev'),
            username: envOrDefault('PG_USER_LOCAL', 'postgres'),
            password: envOrDefault('PG_PASSWORD_LOCAL', 'postgres'),
            dialect: envOrDefault('PG_DIALECT_LOCAL', 'postgres'),
    };

    } 
    else if (dbEnv === 'cloud') 
    {
        dbConfig = {
            host: requireEnv('PG_HOST'),
            port: envOrDefault('PG_PORT', 5432),
            database: requireEnv('PG_DATABASE'),
            username: requireEnv('PG_USER'),
            password: requireEnv('PG_PASSWORD'),
            dialect: envOrDefault('PG_DIALECT', 'postgres'),
        }
    }
    else {
    throw new Error(`Unsupported DB_ENV "${dbEnv}". Use "local" or "cloud".`);
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

