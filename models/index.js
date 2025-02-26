// models/index.js
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/dbConfig');

// Load all models
const Product = require('./Product');
const Image = require('./Image');
const Request = require('./Request');

// Setup associations here if not defined inside the models
Product.hasMany(Image, { foreignKey: 'productId' });
Image.belongsTo(Product, { foreignKey: 'productId' });
Product.belongsTo(Request, { foreignKey: 'requestId' });

module.exports = {
  sequelize,
  Product,
  Image,
  Request,
};
