const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Item', {
    item_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    item_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'items',
    timestamps: false,
  });
};


