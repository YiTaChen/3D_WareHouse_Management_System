const { Sequelize, DataTypes } = require('sequelize');


module.exports = ( sequelize, DataTypes ) => {
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

    return Test1;
}


