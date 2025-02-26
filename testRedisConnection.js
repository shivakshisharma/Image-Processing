
const {redisConnection}=require('./config/redisConnection')

redisConnection.set('key', 'value', (err, result) => {
    if (err) {
        console.error('Error connecting to Redis:', err);
    } else {
        console.log('Successfully connected to Redis:', result);
    }
});
