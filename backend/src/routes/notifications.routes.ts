// backend/src/routes/notifications.routes.ts
import { Router } from 'express';
import {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  getActiveNotifications,
} from '../controllers/notifications.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// 📢 Notificaciones activas (público)
router.get('/active', getActiveNotifications);

// 🔒 Todas las demás rutas requieren autenticación
router.use(authenticate);

// 📋 Listar notificaciones (ADMIN y MANAGER)
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getAllNotifications);

// 🔍 Obtener por ID (ADMIN y MANAGER)
router.get('/:id', authorizeRoles('ADMIN', 'MANAGER'), getNotificationById);

// ➕ Crear notificación (ADMIN y MANAGER)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createNotification);

// ✏️ Actualizar notificación (ADMIN y MANAGER)
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateNotification);

// 🗑️ Eliminar notificación (ADMIN y MANAGER)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), deleteNotification);

export default router;