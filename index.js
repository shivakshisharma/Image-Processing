const express = require('express');
const multer = require('multer');
const { sequelize } = require('./config/database');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Import Routes
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api', uploadRoutes);

// Database Connection
sequelize.sync().then(() => {
    console.log('PostgreSQL Database synced successfully');
}).catch(err => {
    console.error('Database sync error:', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
