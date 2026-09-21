const authService = require('../services/auth.service');
const passwordResetService = require('../services/passwordReset.service');
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

/**
 * POST /api/auth/forgot-password
 * Request a 6-digit password reset OTP email.
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await passwordResetService.requestPasswordReset(email);
    return response.success(res, result.message);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verify-reset-otp
 * Verify the 6-digit OTP and receive a single-use reset authorization token.
 */
async function verifyResetOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    const result = await passwordResetService.verifyResetOtp(email, otp);
    return response.success(res, 'Verification code confirmed.', { reset_token: result.reset_token });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 * Reset user password using the authorized reset token.
 */
async function resetPassword(req, res, next) {
  try {
    const { reset_token, new_password } = req.body;
    const result = await passwordResetService.resetPassword(reset_token, new_password);
    return response.success(res, result.message);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};

