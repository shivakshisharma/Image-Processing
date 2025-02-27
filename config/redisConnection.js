const Redis = require("ioredis");
require("dotenv").config();

const redisConnection = new Redis({
    host: process.env.REDIS_HOST,  // Corrected variable name
    port: parseInt(process.env.REDIS_PORT, 10), // Convert port to number
    password: process.env.REDIS_PASSWORD,
    tls: { rejectUnauthorized: false } // Upstash requires TLS
});

redisConnection.on("connect", () => console.log("✅ Connected to Redis!"));
redisConnection.on("error", (err) => console.error("❌ Redis Error:", err));

module.exports = { redisConnection };
