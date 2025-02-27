const Redis = require("ioredis");
require("dotenv").config();

const redisConnection = new Redis(process.env.REDIS_URL, {
    tls: { } // Ensure TLS is enabled
});

redisConnection.on("connect", () => console.log("✅ Connected to Redis!"));
redisConnection.on("error", (err) => console.error("❌ Redis Error:", err));

module.exports = { redisConnection };

