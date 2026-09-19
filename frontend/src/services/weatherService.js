import api from './api';

const weatherService = {
  async getWeather(lat, lon, date = null) {
    const params = { lat, lon };
    if (date) {
      // Normalize if passed as ISO string or Date object
      params.date = typeof date === 'string' && date.includes('T') ? date.split('T')[0] : date;
    }
    const response = await api.get('/weather', { params });
    return response.data;
  }
};

export default weatherService;
