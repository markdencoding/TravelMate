import api from './api';

const mapsService = {
  /**
   * Search for locations via the backend maps proxy
   * @param {string} query The location name to search
   */
  async search(query) {
    if (!query) return { success: true, data: [] };
    
    // We pass errors back up. A 503 means the API key isn't set on the backend.
    const response = await api.get(`/maps/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};

export default mapsService;
