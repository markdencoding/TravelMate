/**
 * TravelMate Trip Service
 * API calls for trip management endpoints.
 */
import api from './api';

const tripService = {
  /**
   * Get all trips for the authenticated user.
   * @returns {Promise<object>} API response data
   */
  async getTrips() {
    const response = await api.get('/trips');
    return response.data;
  },

  /**
   * Get a specific trip by ID.
   * @param {string} id - Trip ID
   * @returns {Promise<object>} API response data
   */
  async getTrip(id) {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },

  /**
   * Create a new trip.
   * @param {object} data - Trip data (name, start_date, etc.)
   * @returns {Promise<object>} API response data
   */
  async createTrip(data) {
    const response = await api.post('/trips', data);
    return response.data;
  },

  /**
   * Update an existing trip.
   * @param {string} id - Trip ID
   * @param {object} data - Updated trip data
   * @returns {Promise<object>} API response data
   */
  async updateTrip(id, data) {
    const response = await api.put(`/trips/${id}`, data);
    return response.data;
  },

  /**
   * Delete a trip.
   * @param {string} id - Trip ID
   * @returns {Promise<object>} API response data
   */
  async deleteTrip(id) {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  }
};

export default tripService;
