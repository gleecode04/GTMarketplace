import { verifyAccessToken, extractTokenFromHeader } from '../utils/auth.js';
import User from '../models/User.js';

/**
 * Middleware to authenticate JWT tokens
 * This middleware will be available but not applied to routes yet
 */
export const authenticateJWT = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return res.status(401).json({ 
                message: 'Access token required',
                error: 'NO_TOKEN'
            });
        }

        // Verify the token
        const decoded = verifyAccessToken(token);
        
        // Find user in database to ensure they still exist
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                message: 'User not found',
                error: 'USER_NOT_FOUND'
            });
        }

        // Add user info to request object
        req.user = {
            id: user._id,
            email: user.email,
            username: user.username,
            fullName: user.fullName
        };

        next();
    } catch (error) {
        console.error('JWT Authentication Error:', error.message);
        
        if (error.message.includes('expired')) {
            return res.status(401).json({ 
                message: 'Token expired',
                error: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.message.includes('invalid')) {
            return res.status(401).json({ 
                message: 'Invalid token',
                error: 'INVALID_TOKEN'
            });
        }

        return res.status(401).json({ 
            message: 'Authentication failed',
            error: 'AUTH_FAILED'
        });
    }
};

/**
 * Optional middleware - authenticate but don't require it
 * Useful for routes that work with or without authentication
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            // No token provided, continue without authentication
            req.user = null;
            return next();
        }

        // Try to verify token
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user) {
            req.user = {
                id: user._id,
                email: user.email,
                username: user.username,
                fullName: user.fullName
            };
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        // Token invalid, but continue without authentication
        req.user = null;
        next();
    }
};

/**
 * Middleware to check if user is authenticated (for future use)
 * This will be used when you want to protect specific routes
 */
export const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            message: 'Authentication required',
            error: 'AUTH_REQUIRED'
        });
    }
    next();
};

/**
 * Middleware to check user roles (for future use)
 * @param {Array} allowedRoles - Array of allowed roles
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Authentication required',
                error: 'AUTH_REQUIRED'
            });
        }

        // For now, all users have the same role
        // This can be extended when you add role-based access control
        const userRole = 'user'; // Default role
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                message: 'Insufficient permissions',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};
