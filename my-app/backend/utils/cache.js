import redis from '../config/redis.js';

// Cache configuration
const CACHE_TTL = {
    LISTINGS: 300, // 5 minutes
    USER_DATA: 600, // 10 minutes
    LISTING_DETAILS: 180, // 3 minutes
    CATEGORY_RESULTS: 300, // 5 minutes
    PRICE_RESULTS: 300, // 5 minutes
    USER_LISTINGS: 600, // 10 minutes
    INTERESTED_LISTINGS: 300, // 5 minutes
    SEARCH_RESULTS: 120, // 2 minutes
};

// Cache key generators
export const CacheKeys = {
    // Listing keys
    activeListings: () => 'listings:active',
    listingById: (id) => `listing:${id}`,
    listingsByCategory: (category) => `listings:category:${category}`,
    listingsByPrice: (min, max) => `listings:price:${min}-${max}`,
    listingsByCondition: (condition) => `listings:condition:${condition}`,
    listingsBySeller: (sellerId) => `listings:seller:${sellerId}`,
    
    // User keys
    userById: (id) => `user:${id}`,
    userByEmail: (email) => `user:email:${email}`,
    userListings: (userId) => `user:${userId}:listings`,
    userInterestedListings: (userId) => `user:${userId}:interested`,
    userInactiveListings: (userId) => `user:${userId}:inactive`,
    
    // Search keys
    searchResults: (query) => `search:${Buffer.from(query).toString('base64')}`,
    
    // Combined data keys
    listingWithSeller: (listingId) => `listing:${listingId}:with-seller`,
};

/**
 * Generic cache get function
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached data or null
 */
export const getCache = async (key) => {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Cache get error for key ${key}:`, error);
        return null;
    }
};

/**
 * Generic cache set function
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export const setCache = async (key, data, ttl = 300) => {
    try {
        await redis.setex(key, ttl, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Cache set error for key ${key}:`, error);
        return false;
    }
};

/**
 * Delete cache by key
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
export const deleteCache = async (key) => {
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error(`Cache delete error for key ${key}:`, error);
        return false;
    }
};

/**
 * Delete multiple cache keys by pattern
 * @param {string} pattern - Redis pattern (e.g., 'user:123:*')
 * @returns {Promise<number>} Number of keys deleted
 */
export const deleteCachePattern = async (pattern) => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            return await redis.del(...keys);
        }
        return 0;
    } catch (error) {
        console.error(`Cache pattern delete error for pattern ${pattern}:`, error);
        return 0;
    }
};

/**
 * Cache with fallback function
 * @param {string} key - Cache key
 * @param {Function} fallback - Function to execute if cache miss
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} Cached or fresh data
 */
export const getOrSetCache = async (key, fallback, ttl = 300) => {
    try {
        // Try to get from cache first
        const cached = await getCache(key);
        if (cached !== null) {
            console.log(`✅ Cache hit for key: ${key}`);
            return cached;
        }

        // Cache miss - execute fallback function
        console.log(`❌ Cache miss for key: ${key}`);
        const data = await fallback();
        
        // Cache the result
        if (data !== null && data !== undefined) {
            await setCache(key, data, ttl);
            console.log(`💾 Cached data for key: ${key}`);
        }
        
        return data;
    } catch (error) {
        console.error(`Cache getOrSet error for key ${key}:`, error);
        // Fallback to direct execution on cache error
        return await fallback();
    }
};

/**
 * Invalidate user-related caches
 * @param {string} userId - User ID
 */
export const invalidateUserCaches = async (userId) => {
    const patterns = [
        `user:${userId}`,
        `user:${userId}:*`,
        `listings:seller:${userId}`,
    ];
    
    for (const pattern of patterns) {
        await deleteCachePattern(pattern);
    }
    console.log(`🗑️ Invalidated user caches for user: ${userId}`);
};

/**
 * Invalidate listing-related caches
 * @param {string} listingId - Listing ID
 */
export const invalidateListingCaches = async (listingId) => {
    const patterns = [
        `listing:${listingId}`,
        `listing:${listingId}:*`,
        'listings:active',
        'listings:category:*',
        'listings:price:*',
        'listings:condition:*',
    ];
    
    for (const pattern of patterns) {
        await deleteCachePattern(pattern);
    }
    console.log(`🗑️ Invalidated listing caches for listing: ${listingId}`);
};

/**
 * Cache middleware factory
 * @param {string} keyGenerator - Function to generate cache key
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
export const createCacheMiddleware = (keyGenerator, ttl = 300) => {
    return async (req, res, next) => {
        try {
            const key = keyGenerator(req);
            const cached = await getCache(key);
            
            if (cached !== null) {
                console.log(`✅ Cache middleware hit for key: ${key}`);
                return res.json(cached);
            }
            
            // Store original res.json to intercept response
            const originalJson = res.json;
            res.json = function(data) {
                // Cache the response
                setCache(key, data, ttl).then(() => {
                    console.log(`💾 Cache middleware cached key: ${key}`);
                });
                
                // Call original json method
                return originalJson.call(this, data);
            };
            
            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Warm up cache with frequently accessed data
 */
export const warmUpCache = async () => {
    try {
        console.log('🔥 Starting cache warm-up...');
        
        // You can add specific warm-up logic here
        // For example, pre-load active listings, popular categories, etc.
        
        console.log('✅ Cache warm-up completed');
    } catch (error) {
        console.error('❌ Cache warm-up failed:', error);
    }
};

export { CACHE_TTL };
