

// Database connection
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,  // Set to true if you want to debug queries
});

module.exports = { sequelize };

