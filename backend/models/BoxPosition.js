const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('BoxPosition', {
    boxPosition_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    box_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position_x: DataTypes.INTEGER,
    position_y: DataTypes.INTEGER,
    position_z: DataTypes.INTEGER,
  }, {
    tableName: 'boxPosition',
    timestamps: false,
  });
};

