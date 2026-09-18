import api from './api';

const mapsService = {
  /**
   * Search for locations via the backend maps proxy
   * @param {string} query The location name to search
   */
  async search(query) {
    if (!query) return { success: true, data: [] };
    
    const response = await api.get(`/maps/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  /**
   * Reverse geocode coordinates to location name and address
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   */
  async reverse(lat, lon) {
    const response = await api.get('/maps/reverse', {
      params: { lat, lon }
    });
    return response.data;
  }
};

export default mapsService;
