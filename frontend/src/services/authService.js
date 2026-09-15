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
};

export default authService;
