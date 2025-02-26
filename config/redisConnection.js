const Redis = require('ioredis');
require('dotenv').config();

const redisConnection = new Redis({
    host: process.env.host,  // Upstash URL without the https:// prefix
    port: process.env.port, // The port for Redis is 6379
    password: process.env.password,
    tls: {} // Ensure you are using TLS for Upstash Redis
});

module.exports={redisConnection};