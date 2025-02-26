
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConfig');
const Product = require('./Product');  // Ensure this is correctly imported after Product is defined

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    references: {
      model: Product,
      key: 'id',
    },
  },
  inputUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  outputUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
  }
}, {
  timestamps: true,
});

// Associations
Image.belongsTo(Product, { foreignKey: 'productId' });

module.exports = Image;
