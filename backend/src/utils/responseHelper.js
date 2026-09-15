/**
 * Standardized API response helpers.
 * Follows DESIGN.md §21 response format.
 */

/**
 * Send a success response.
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {object|array|null} data - Response data
 * @param {number} statusCode - HTTP status code (default 200)
 */
function success(res, message = 'Operation successful.', data = null, statusCode = 200) {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send an error response.
 * @param {object} res - Express response object
 * @param {string} message - User-facing error message
 * @param {string|null} error - Technical error detail (omitted in production)
 * @param {number} statusCode - HTTP status code (default 500)
 */
function error(res, message = 'Unable to complete the operation.', error = null, statusCode = 500) {
  const response = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV !== 'production') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
}

module.exports = { success, error };
