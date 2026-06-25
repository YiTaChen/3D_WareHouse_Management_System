const { sequelize, Item } = require('../models');
const { defaultItems } = require('./defaultItems');

const getSyncOptions = () => {
  if (sequelize.getDialect() === 'sqlite') {
    return {};
  }

  return { alter: true };
};

const seedDefaultItems = async () => {
  const itemCount = await Item.count();

  if (itemCount > 0) {
    return;
  }

  await Item.bulkCreate(defaultItems);
  console.log(`Seeded ${defaultItems.length} default items`);
};

const initializeDatabase = async () => {
  await sequelize.authenticate();
  console.log(`Database connected (${sequelize.getDialect()})`);

  await sequelize.sync(getSyncOptions());
  console.log('Database tables synchronized');

  await seedDefaultItems();
};

module.exports = {
  initializeDatabase,
  seedDefaultItems,
};
