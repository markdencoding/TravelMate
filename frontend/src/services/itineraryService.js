import api from './api';

const itineraryService = {
  // Days
  async getItinerary(tripId) {
    const response = await api.get(`/trips/${tripId}/itinerary`);
    return response.data;
  },
  async createDay(tripId, data) {
    const response = await api.post(`/trips/${tripId}/itinerary/days`, data);
    return response.data;
  },
  async updateDay(tripId, dayId, data) {
    const response = await api.put(`/trips/${tripId}/itinerary/days/${dayId}`, data);
    return response.data;
  },
  async deleteDay(tripId, dayId) {
    const response = await api.delete(`/trips/${tripId}/itinerary/days/${dayId}`);
    return response.data;
  },
  
  // Activities
  async createActivity(tripId, dayId, data) {
    const response = await api.post(`/trips/${tripId}/itinerary/days/${dayId}/activities`, data);
    return response.data;
  },
  async updateActivity(tripId, dayId, activityId, data) {
    const response = await api.put(`/trips/${tripId}/itinerary/days/${dayId}/activities/${activityId}`, data);
    return response.data;
  },
  async deleteActivity(tripId, dayId, activityId) {
    const response = await api.delete(`/trips/${tripId}/itinerary/days/${dayId}/activities/${activityId}`);
    return response.data;
  }
};

export default itineraryService;
