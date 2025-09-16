import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
};

// Create Redis client
const redis = new Redis(redisConfig);

// Redis connection event handlers
redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

redis.on('close', () => {
    console.log('🔌 Redis connection closed');
});

redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});

// Test Redis connection
const testConnection = async () => {
    try {
        await redis.ping();
        console.log('✅ Redis ping successful');
        return true;
    } catch (error) {
        console.error('❌ Redis ping failed:', error);
        return false;
    }
};

// Graceful shutdown
const closeRedisConnection = async () => {
    try {
        await redis.quit();
        console.log('✅ Redis connection closed gracefully');
    } catch (error) {
        console.error('❌ Error closing Redis connection:', error);
    }
};

export { redis, testConnection, closeRedisConnection };
export default redis;
