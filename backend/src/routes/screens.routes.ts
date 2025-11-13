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

// ⚠️ IMPORTANTE: Las rutas públicas DEBEN ir ANTES de authenticate

// 💓 Heartbeat PÚBLICO (sin autenticación)
router.post('/heartbeat/:code', heartbeat);

// 🔍 Obtener por código PÚBLICO (para el player)
router.get('/code/:code', getScreenByCode);

// 📊 Estadísticas PÚBLICO (para monitoreo)
router.get('/stats', getScreenStats);

// 🔒 A partir de aquí, todas las rutas requieren autenticación
router.use(authenticate);

// 📋 Listar pantallas (ADMIN y MANAGER)
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getAllScreens);

// 🔍 Obtener por ID (ADMIN y MANAGER)
router.get('/:id', authorizeRoles('ADMIN', 'MANAGER'), getScreenById);

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