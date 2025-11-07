// frontend/src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Crear instancia de axios con configuración base
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

// ========================================
// 🔐 AUTENTICACIÓN
// ========================================
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  verifyToken: () =>
    api.get('/auth/verify'),
    
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

// ========================================
// 👥 USUARIOS
// ========================================
export const usersAPI = {
  getAll: () =>
    api.get('/users'),
  
  getById: (id: number) =>
    api.get(`/users/${id}`),
  
  create: (data: {
    email: string;
    password: string;
    name: string;
    role: 'ADMIN' | 'MANAGER';
  }) =>
    api.post('/users', data),
  
  update: (id: number, data: any) =>
    api.put(`/users/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/users/${id}`),
  
  toggleStatus: (id: number) =>
    api.patch(`/users/${id}/toggle`),
};

// ========================================
// 🏢 ÁREAS
// ========================================
export const areasAPI = {
  getAll: () =>
    api.get('/areas'),
  
  getById: (id: number) =>
    api.get(`/areas/${id}`),
  
  create: (data: {
    name: string;
    description?: string;
    managerId?: number;
  }) =>
    api.post('/areas', data),
  
  update: (id: number, data: any) =>
    api.put(`/areas/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/areas/${id}`),
    
  getByManager: (managerId: number) =>
    api.get(`/areas/manager/${managerId}`),
};

// ========================================
// 📺 PANTALLAS
// ========================================
export const screensAPI = {
  getAll: () =>
    api.get('/screens'),
  
  getById: (id: number) =>
    api.get(`/screens/${id}`),
  
  getByCode: (code: string) =>
    api.get(`/screens/code/${code}`),
  
  getStats: () =>
    api.get('/screens/stats'),
  
  create: (data: {
    name: string;
    ipAddress?: string;
    areaId: number;
  }) =>
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
    api.post(`/screens/heartbeat/${code}`, data || {}),
};

// ========================================
// 📁 CONTENIDO
// ========================================
export const contentAPI = {
  upload: (formData: FormData, config?: any) =>
    api.post('/content/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    }),
  
  getAll: (params?: {
    areaId?: number;
    type?: string;
    active?: boolean;
  }) =>
    api.get('/content', { params }),
  
  getById: (id: number) =>
    api.get(`/content/${id}`),
  
  update: (id: number, data: {
    title?: string;
    description?: string;
    active?: boolean;
    schedule?: any;
  }) =>
    api.put(`/content/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/content/${id}`),
  
  getStats: () =>
    api.get('/content/stats'),
  
  createPlaylist: (data: {
    name: string;
    description?: string;
    contentIds: number[];
    areaId?: number;
    loop?: boolean;
    shuffle?: boolean;
  }) =>
    api.post('/content/playlist', data),
  
  assignToScreen: (data: {
    screenCode: string;
    contentId?: number;
    playlistId?: number;
    immediate?: boolean;
  }) =>
    api.post('/content/assign', data),
    
  getPlaylists: () =>
    api.get('/content/playlists'),
    
  updatePlaylist: (id: number, data: any) =>
    api.put(`/content/playlist/${id}`, data),
    
  deletePlaylist: (id: number) =>
    api.delete(`/content/playlist/${id}`),
};

// ========================================
// 📢 NOTIFICACIONES
// ========================================
export const notificationsAPI = {
  create: (data: {
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'ALERT' | 'EMERGENCY';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    areaId?: number;
    screenCodes?: string[];
    duration?: number;
    displayImmediately?: boolean;
  }) =>
    api.post('/notifications', data),
  
  getAll: (params?: {
    active?: boolean;
    areaId?: number;
    type?: string;
    priority?: string;
  }) =>
    api.get('/notifications', { params }),
  
  getById: (id: number) =>
    api.get(`/notifications/${id}`),
  
  update: (id: number, data: any) =>
    api.put(`/notifications/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/notifications/${id}`),
  
  sendEmergency: (data: {
    title?: string;
    message: string;
  }) =>
    api.post('/notifications/emergency', data),
  
  getActiveForScreen: (screenCode: string) =>
    api.get(`/notifications/screen/${screenCode}`),
  
  getStats: () =>
    api.get('/notifications/stats'),
};

// ========================================
// 📊 MONITOREO
// ========================================
export const monitorAPI = {
  getGlobal: () =>
    api.get('/monitor/global'),
  
  getArea: (areaId: number) =>
    api.get(`/monitor/area/${areaId}`),
  
  getRealTimeStatus: () =>
    api.get('/monitor/realtime'),
  
  getScreenCapture: (screenCode: string) =>
    api.get(`/monitor/capture/${screenCode}`),
  
  remoteControl: (screenCode: string, data: {
    action: 'play' | 'pause' | 'stop' | 'next' | 'previous' | 
            'volume' | 'refresh' | 'restart' | 'changeContent';
    data?: any;
  }) =>
    api.post(`/monitor/control/${screenCode}`, data),
  
  getScreenLogs: (screenCode: string, params?: {
    limit?: number;
    offset?: number;
  }) =>
    api.get(`/monitor/logs/${screenCode}`, { params }),
};

// ========================================
// 📈 ESTADÍSTICAS GENERALES
// ========================================
export const statsAPI = {
  getDashboard: () =>
    Promise.all([
      screensAPI.getStats(),
      contentAPI.getStats(),
      notificationsAPI.getStats(),
    ]).then(([screens, content, notifications]) => ({
      screens: screens.data,
      content: content.data,
      notifications: notifications.data,
    })),
  
  getAreaStats: (areaId: number) =>
    api.get(`/stats/area/${areaId}`),
  
  getUsageStats: (params?: {
    startDate?: string;
    endDate?: string;
  }) =>
    api.get('/stats/usage', { params }),
};

// ========================================
// 🔧 UTILIDADES
// ========================================
export const utilsAPI = {
  // Verificar salud del servidor
  checkHealth: () =>
    axios.get(`${API_URL}/health`),
  
  // Obtener configuración del sistema
  getConfig: () =>
    api.get('/config'),
  
  // Subir archivo genérico
  uploadFile: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return api.post('/utils/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Descargar archivo
  downloadFile: (path: string) =>
    api.get(`/utils/download`, {
      params: { path },
      responseType: 'blob',
    }),
};

// ========================================
// 🔌 WEBSOCKET
// ========================================
export const websocketURL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

export const websocketEvents = {
  // Eventos de pantalla
  SCREEN_STATUS: 'screen-status',
  SCREEN_STATUS_UPDATE: 'screen-status-update',
  SCREEN_APPROVED: 'screen-approved',
  SCREEN_HEARTBEAT: 'screen-heartbeat',
  
  // Eventos de contenido
  CONTENT_UPLOADED: 'content-uploaded',
  CONTENT_UPDATED: 'content-updated',
  CONTENT_CHANGE: 'content-change',
  
  // Eventos de notificaciones
  NOTIFICATION_RECEIVED: 'notification-received',
  URGENT_NOTIFICATION: 'urgent-notification',
  EMERGENCY_ALERT: 'emergency-alert',
  
  // Eventos de control remoto
  REMOTE_CONTROL: 'remote-control',
  REQUEST_CAPTURE: 'request-capture',
  
  // Eventos de conexión
  JOIN_SCREEN: 'join-screen',
  JOIN_AREA: 'join-area',
  LEAVE_SCREEN: 'leave-screen',
  LEAVE_AREA: 'leave-area',
};

export default api;