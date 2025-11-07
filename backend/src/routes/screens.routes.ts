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

// 💓 HEARTBEAT - NO requiere autenticación (para que las pantallas puedan reportar)
router.post('/heartbeat/:code', heartbeat);

// 🔍 Obtener por código - NO requiere autenticación (para el player inicial)
router.get('/code/:code', getScreenByCode);

// === RUTAS PROTEGIDAS (requieren autenticación) ===
// 📊 Estadísticas (ADMIN y MANAGER)
router.get('/stats', authenticate, authorizeRoles('ADMIN', 'MANAGER'), getScreenStats);

// 📋 Listar pantallas (ADMIN y MANAGER)
router.get('/', authenticate, authorizeRoles('ADMIN', 'MANAGER'), getAllScreens);

// 🔍 Obtener por ID (ADMIN y MANAGER)
router.get('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGER'), getScreenById);

// ➕ Registrar nueva pantalla (ADMIN y MANAGER)
router.post('/', authenticate, authorizeRoles('ADMIN', 'MANAGER'), registerScreen);

// ✏️ Actualizar pantalla (ADMIN y MANAGER)
router.put('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGER'), updateScreen);

// 🗑️ Eliminar pantalla (ADMIN y MANAGER)
router.delete('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGER'), deleteScreen);

// ✅ Aprobar pantalla (solo ADMIN)
router.patch('/:id/approve', authenticate, authorizeRoles('ADMIN'), approveScreen);

// ❌ Rechazar pantalla (solo ADMIN)
router.patch('/:id/reject', authenticate, authorizeRoles('ADMIN'), rejectScreen);

export default router;