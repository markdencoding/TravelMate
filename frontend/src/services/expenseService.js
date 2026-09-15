import api from './api';

const expenseService = {
  async getExpenses(tripId) {
    const response = await api.get(`/trips/${tripId}/expenses`);
    return response.data;
  },
  async getSummary(tripId) {
    const response = await api.get(`/trips/${tripId}/expenses/summary`);
    return response.data;
  },
  async createExpense(tripId, data) {
    const response = await api.post(`/trips/${tripId}/expenses`, data);
    return response.data;
  },
  async updateExpense(tripId, expenseId, data) {
    const response = await api.put(`/trips/${tripId}/expenses/${expenseId}`, data);
    return response.data;
  },
  async deleteExpense(tripId, expenseId) {
    const response = await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
    return response.data;
  }
};

export default expenseService;
