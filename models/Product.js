// models/Product.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConfig');
const Request = require('./Request');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  requestId: {
    type: DataTypes.UUID,
    references: {
      model: Request,
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Product;
