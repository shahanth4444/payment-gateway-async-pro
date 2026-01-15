const Queue = require('bull');
const Redis = require('ioredis');

// Redis client configuration
const redisConfig = {
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
    },
};

// Create job queues
const paymentQueue = new Queue('payment-processing', redisConfig);
const webhookQueue = new Queue('webhook-delivery', redisConfig);
const refundQueue = new Queue('refund-processing', redisConfig);

// Redis client for direct operations
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('connect', () => {
    console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

module.exports = {
    paymentQueue,
    webhookQueue,
    refundQueue,
    redisClient,
};
