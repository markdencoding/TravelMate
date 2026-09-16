/**
 * TravelMate API Client
 * Axios instance configured with base URL, auth token interceptor,
 * and centralized error handling.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('travelmate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 and we have a stored token, it's expired/invalid
    if (error.response?.status === 401) {
      // Prevent redirect loops and avoid redirecting on the login page itself
      if (window.location.pathname !== '/login') {
        const token = localStorage.getItem('travelmate_token');
        if (token) {
          localStorage.removeItem('travelmate_token');
          localStorage.removeItem('travelmate_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
