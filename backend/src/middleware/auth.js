const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/AppError');

/**
 * JWT authentication middleware.
 * Extracts the token from the Authorization header,
 * verifies it, and attaches the user payload to req.user.
 *
 * Usage: router.get('/protected', authenticate, handler)
 */
function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please login.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication required. Please login.', 401);
    }

    if (!config.jwtSecret) {
      throw new AppError('Server authentication is not configured.', 500);
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    // JWT-specific errors are handled by errorHandler middleware
    next(err);
  }
}

/**
 * Role-based authorization middleware.
 * Must be used AFTER authenticate middleware.
 *
 * Usage: router.get('/admin', authenticate, authorize('admin'), handler)
 *
 * @param  {...string} roles - Allowed roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    next();
  };
}

module.exports = { authenticate, authorize };
