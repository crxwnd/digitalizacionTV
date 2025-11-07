// frontend/src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 🔐 Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  verifyToken: () =>
    api.get('/auth/verify'),
};

// 👥 Users
export const usersAPI = {
  getAll: () =>
    api.get('/users'),
  
  getById: (id: number) =>
    api.get(`/users/${id}`),
  
  create: (data: any) =>
    api.post('/users', data),
  
  update: (id: number, data: any) =>
    api.put(`/users/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/users/${id}`),
  
  toggleStatus: (id: number) =>
    api.patch(`/users/${id}/toggle`),
};

// 🏢 Areas
export const areasAPI = {
  getAll: () =>
    api.get('/areas'),
  
  getById: (id: number) =>
    api.get(`/areas/${id}`),
  
  create: (data: any) =>
    api.post('/areas', data),
  
  update: (id: number, data: any) =>
    api.put(`/areas/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/areas/${id}`),
};

// 📺 Screens
export const screensAPI = {
  getAll: () =>
    api.get('/screens'),
  
  getById: (id: number) =>
    api.get(`/screens/${id}`),
  
  getByCode: (code: string) =>
    api.get(`/screens/code/${code}`),
  
  getStats: () =>
    api.get('/screens/stats'),
  
  create: (data: any) =>
    api.post('/screens', data),
  
  update: (id: number, data: any) =>
    api.put(`/screens/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/screens/${id}`),
  
  approve: (id: number) =>
    api.patch(`/screens/${id}/approve`),
  
  reject: (id: number) =>
    api.patch(`/screens/${id}/reject`),
  
  heartbeat: (code: string, data?: any) =>
    api.post(`/screens/heartbeat/${code}`, data),
};

export default api;