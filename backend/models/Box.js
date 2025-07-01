const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Box', {
    box_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    isRemoved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'boxes',
    timestamps: false,
  });
};

