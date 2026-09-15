import api from './api';

const destinationService = {
  async getDestinations(tripId) {
    const response = await api.get(`/trips/${tripId}/destinations`);
    return response.data;
  },

  async createDestination(tripId, data) {
    const response = await api.post(`/trips/${tripId}/destinations`, data);
    return response.data;
  },

  async updateDestination(tripId, id, data) {
    const response = await api.put(`/trips/${tripId}/destinations/${id}`, data);
    return response.data;
  },

  async deleteDestination(tripId, id) {
    const response = await api.delete(`/trips/${tripId}/destinations/${id}`);
    return response.data;
  }
};

export default destinationService;
