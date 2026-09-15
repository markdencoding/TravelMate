const authService = require('../services/auth.service');
const response = require('../utils/responseHelper');

/**
 * POST /api/auth/register
 * Register a new user account.
 */
async function register(req, res, next) {
  try {
    const { full_name, email, password } = req.body;

    const user = await authService.register(full_name, email, password);

    return response.success(res, 'Account created successfully.', { user }, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT token.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const { user, token } = await authService.login(email, password);

    return response.success(res, 'Login successful.', { user, token });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Logout is client-side (token removal) for JWT-based auth.
 * This endpoint exists for API completeness.
 */
async function logout(req, res, next) {
  try {
    return response.success(res, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Get the currently authenticated user's profile.
 * Requires authentication middleware.
 */
async function getMe(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);

    return response.success(res, 'User profile retrieved.', { user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe };
