/**
 * TravelMate Auth Service
 * API calls for authentication endpoints.
 */
import api from './api';

const authService = {
  /**
   * Register a new user account.
   * @param {object} data - { full_name, email, password }
   * @returns {Promise<object>} API response data
   */
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Login with email and password.
   * @param {object} data - { email, password }
   * @returns {Promise<object>} API response data with { user, token }
   */
  async login(data) {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  /**
   * Logout the current user.
   * @returns {Promise<object>} API response data
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Get the currently authenticated user's profile.
   * @returns {Promise<object>} API response data with { user }
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Request a 6-digit password reset OTP email.
   * @param {string} email
   * @returns {Promise<object>} API response data
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Verify the 6-digit OTP code and retrieve reset authorization token.
   * @param {string} email
   * @param {string} otp
   * @returns {Promise<object>} API response data with { reset_token }
   */
  async verifyResetOtp(email, otp) {
    const response = await api.post('/auth/verify-reset-otp', { email, otp });
    return response.data;
  },

  /**
   * Reset password with the authorized reset token.
   * @param {string} resetToken
   * @param {string} newPassword
   * @returns {Promise<object>} API response data
   */
  async resetPassword(resetToken, newPassword) {
    const response = await api.post('/auth/reset-password', {
      reset_token: resetToken,
      new_password: newPassword,
    });
    return response.data;
  },
};

export default authService;

