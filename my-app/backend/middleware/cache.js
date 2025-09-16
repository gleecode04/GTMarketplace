import { createCacheMiddleware, CacheKeys, CACHE_TTL } from '../utils/cache.js';

/**
 * Cache middleware for active listings (most frequently accessed)
 */
export const cacheActiveListings = createCacheMiddleware(
    () => CacheKeys.activeListings(),
    CACHE_TTL.LISTINGS
);

/**
 * Cache middleware for listing details
 */
export const cacheListingDetails = createCacheMiddleware(
    (req) => CacheKeys.listingById(req.params.id),
    CACHE_TTL.LISTING_DETAILS
);

/**
 * Cache middleware for user profile data
 */
export const cacheUserProfile = createCacheMiddleware(
    (req) => CacheKeys.userById(req.params.id),
    CACHE_TTL.USER_DATA
);

/**
 * Cache middleware for listings by category
 */
export const cacheCategoryListings = createCacheMiddleware(
    (req) => CacheKeys.listingsByCategory(req.params.category),
    CACHE_TTL.CATEGORY_RESULTS
);

/**
 * Cache middleware for listings by price range
 */
export const cachePriceListings = createCacheMiddleware(
    (req) => CacheKeys.listingsByPrice(req.query.min, req.query.max),
    CACHE_TTL.PRICE_RESULTS
);

/**
 * Cache middleware for user listings
 */
export const cacheUserListings = createCacheMiddleware(
    (req) => CacheKeys.userListings(req.params.id),
    CACHE_TTL.USER_LISTINGS
);

/**
 * Cache middleware for user interested listings
 */
export const cacheUserInterestedListings = createCacheMiddleware(
    (req) => CacheKeys.userInterestedListings(req.params.id),
    CACHE_TTL.INTERESTED_LISTINGS
);

/**
 * Cache middleware for listings by seller
 */
export const cacheSellerListings = createCacheMiddleware(
    (req) => CacheKeys.listingsBySeller(req.params.id),
    CACHE_TTL.USER_LISTINGS
);

/**
 * Cache middleware for listings by condition
 */
export const cacheConditionListings = createCacheMiddleware(
    (req) => CacheKeys.listingsByCondition(req.params.condition),
    CACHE_TTL.CATEGORY_RESULTS
);

/**
 * Generic cache middleware factory for custom TTL
 */
export const createCustomCacheMiddleware = (keyGenerator, ttl = 300) => {
    return createCacheMiddleware(keyGenerator, ttl);
};

/**
 * Cache middleware that can be conditionally applied
 */
export const conditionalCache = (condition, middleware) => {
    return (req, res, next) => {
        if (condition(req)) {
            return middleware(req, res, next);
        }
        next();
    };
};

/**
 * Cache middleware that skips cache for authenticated users (optional)
 */
export const cacheForAnonymousOnly = (middleware) => {
    return conditionalCache(
        (req) => !req.user, // Only cache for non-authenticated users
        middleware
    );
};
