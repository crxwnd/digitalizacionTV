// backend/src/routes/notifications.routes.ts
import { Router } from 'express';
import {
  createNotification,
  getAllNotifications,
  updateNotification,
  deleteNotification,
  sendEmergencyAlert,
  getActiveNotificationsForScreen,
  getNotificationStats,
} from '../controllers/notifications.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// 🔒 Todas las rutas requieren autenticación
router.use(authenticate);

// 📊 Estadísticas
router.get('/stats', authorizeRoles('ADMIN', 'MANAGER'), getNotificationStats);

// 📢 Crear notificación
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createNotification);

// 📋 Listar notificaciones
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getAllNotifications);

// 📺 Obtener notificaciones activas para una pantalla
router.get('/screen/:screenCode', getActiveNotificationsForScreen);

// ✏️ Actualizar notificación
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateNotification);

// 🗑️ Eliminar notificación
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), deleteNotification);

// 🚨 Enviar alerta de emergencia (solo ADMIN)
router.post('/emergency', authorizeRoles('ADMIN'), sendEmergencyAlert);

export default router;
