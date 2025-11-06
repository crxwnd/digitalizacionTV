// backend/src/routes/screens.routes.ts
import { Router } from 'express';
import {
  getAllScreens,
  getScreenById,
  getScreenByCode,
  registerScreen,
  updateScreen,
  deleteScreen,
  approveScreen,
  rejectScreen,
  heartbeat,
  getScreenStats,
} from '../controllers/screens.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// 🔒 Todas las rutas requieren autenticación
router.use(authenticate);

// 📊 Estadísticas (ADMIN y MANAGER)
router.get('/stats', authorizeRoles('ADMIN', 'MANAGER'), getScreenStats);

// 📋 Listar pantallas (ADMIN y MANAGER)
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getAllScreens);

// 🔍 Obtener por ID (ADMIN y MANAGER)
router.get('/:id', authorizeRoles('ADMIN', 'MANAGER'), getScreenById);

// 🔍 Obtener por código (para el player)
router.get('/code/:code', getScreenByCode);

// 💓 Heartbeat (cualquier usuario autenticado)
router.post('/heartbeat/:code', heartbeat);

// ➕ Registrar nueva pantalla (ADMIN y MANAGER)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), registerScreen);

// ✏️ Actualizar pantalla (ADMIN y MANAGER)
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateScreen);

// 🗑️ Eliminar pantalla (ADMIN y MANAGER)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), deleteScreen);

// ✅ Aprobar pantalla (solo ADMIN)
router.patch('/:id/approve', authorizeRoles('ADMIN'), approveScreen);

// ❌ Rechazar pantalla (solo ADMIN)
router.patch('/:id/reject', authorizeRoles('ADMIN'), rejectScreen);

export default router;