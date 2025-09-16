import jwt from 'jsonwebtoken';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate JWT access token
 * @param {Object} payload - User data to include in token
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'gt-marketplace',
        audience: 'gt-marketplace-users'
    });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - User data to include in token
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { 
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'gt-marketplace',
        audience: 'gt-marketplace-users'
    });
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'gt-marketplace',
            audience: 'gt-marketplace-users'
        });
    } catch (error) {
        throw new Error(`Invalid access token: ${error.message}`);
    }
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'gt-marketplace',
            audience: 'gt-marketplace-users'
        });
    } catch (error) {
        throw new Error(`Invalid refresh token: ${error.message}`);
    }
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing accessToken and refreshToken
 */
export const generateTokenPair = (user) => {
    const payload = {
        userId: user._id,
        email: user.email,
        username: user.username
    };

    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload)
    };
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    
    return parts[1];
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return true;
        
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    } catch (error) {
        return true;
    }
};
