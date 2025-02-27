
const express = require('express');
const { sequelize, Product, Image, Request } = require('./models');  
// Configuring Redis connection
const redisConnection = require('./config/redisConnection')
require('dotenv').config();

const app = express();

app.use(express.json());

// Importing Routes
const uploadRoutes = require('./routes/uploadRoutes');
const statusRoutes = require('./routes/statusRoutes');  
const webhookRoutes = require('./routes/webhookRoutes'); 

app.use('/api', uploadRoutes);
app.use('/api', statusRoutes); 
app.use('/api', webhookRoutes);  

// Syncing models
sequelize.sync().then(() => {
    console.log('Database synced');
}).catch(err => {
    console.error('Error syncing database:', err);
});
console.log("🔄 Redis Config:", process.env.REDIS_URL);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
