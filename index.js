
const express = require('express');
const { sequelize, Product, Image, Request } = require('./models');  // Import models from centralized index
require('dotenv').config();

const app = express();

app.use(express.json());

// Import Routes
const uploadRoutes = require('./routes/uploadRoutes');
const statusRoutes = require('./routes/statusRoutes');

app.use('/api', uploadRoutes);
app.use('/api', statusRoutes); // Register the Status API

// Sync models
sequelize.sync().then(() => {
    console.log('Database synced');
}).catch(err => {
    console.error('Error syncing database:', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
