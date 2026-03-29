import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updateLocation: (data) => api.put('/auth/location', data),
  addEmergencyContact: (data) => api.post('/auth/emergency-contacts', data),
  removeEmergencyContact: (id) => api.delete(`/auth/emergency-contacts/${id}`)
};

// Journeys
export const journeyAPI = {
  create: (data) => api.post('/journeys', data),
  getAll: (params) => api.get('/journeys', { params }),
  getActive: () => api.get('/journeys/active'),
  getById: (id) => api.get(`/journeys/${id}`),
  start: (id) => api.post(`/journeys/${id}/start`),
  updateLocation: (id, data) => api.post(`/journeys/${id}/location`, data),
  complete: (id) => api.post(`/journeys/${id}/complete`),
  share: (id, data) => api.post(`/journeys/${id}/share`, data)
};

// SOS
export const sosAPI = {
  trigger: (data) => api.post('/sos/trigger', data),
  getActive: () => api.get('/sos/active'),
  getHistory: (params) => api.get('/sos/history', { params }),
  updateLocation: (id, data) => api.put(`/sos/${id}`, data),
  resolve: (id, data) => api.post(`/sos/${id}/resolve`, data),
  acknowledge: (id, data) => api.post(`/sos/${id}/acknowledge`, data)
};

// Safety
export const safetyAPI = {
  getScore: (params) => api.get('/safety/score', { params }),
  getZones: (params) => api.get('/safety/zones', { params }),
  createZone: (data) => api.post('/safety/zones', data),
  getStats: () => api.get('/safety/stats')
};

export default api;
