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
    position_x: DataTypes.FLOAT,
    position_y: DataTypes.FLOAT,
    position_z: DataTypes.FLOAT,
  }, {
    tableName: 'boxPosition',
    timestamps: false,
  });
};

