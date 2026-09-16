import api from './api';

const weatherService = {
  async getWeather(lat, lon) {
    const response = await api.get('/weather', {
      params: { lat, lon }
    });
    return response.data;
  }
};

export default weatherService;
