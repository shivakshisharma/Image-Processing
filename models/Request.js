const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConfig');

const Request = sequelize.define('Request', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
    }
}, {
    timestamps: true,
});

module.exports = Request;
