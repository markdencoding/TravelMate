const AppError = require('../utils/AppError');

/**
 * Centralized error handling middleware.
 * Must be registered LAST in Express middleware chain.
 *
 * Catches all errors thrown in route handlers and services,
 * returning consistent JSON error responses per DESIGN.md §21.
 */
function errorHandler(err, req, res, _next) {
  // Default to 500 if no status code is set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error.';

  // Log the error (always on server, never expose stack to client)
  console.error(`[Error] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === 'development' && err.stack) {
    console.error(err.stack);
  }

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please login again.';
  } else if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    message = 'A record with that information already exists.';
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced record does not exist.';
  }

  // Build response
  const response = {
    success: false,
    message,
  };

  // Include error details in development only
  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    response.error = err.message;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
