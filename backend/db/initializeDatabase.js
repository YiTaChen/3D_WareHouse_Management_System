const database = require('../models');
const { defaultItems } = require('./defaultItems');
const { isProduction } = require('../middleware/security');

const getSyncOptions = (sequelize) => {
  if (sequelize.getDialect() === 'sqlite' || isProduction() || process.env.DB_SCHEMA_ALTER !== 'true') {
    return {};
  }

  return { alter: true };
};

const seedDefaultItems = async (context = database.getModels()) => {
  const { Item } = context;
  const itemCount = await Item.count();

  if (itemCount > 0) {
    return;
  }

  await Item.bulkCreate(defaultItems);
  console.log(`Seeded ${defaultItems.length} default items`);
};

const initializeDatabase = async (context = database.getModels()) => {
  const { sequelize } = context;

  await sequelize.authenticate();
  console.log(`Database connected (${sequelize.getDialect()})`);

  await sequelize.sync(getSyncOptions(sequelize));
  console.log('Database tables synchronized');

  await seedDefaultItems(context);
};

module.exports = {
  initializeDatabase,
  seedDefaultItems,
};
