// backend/src/routes/areas.routes.ts
import { Router } from 'express';
import {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
} from '../controllers/areas.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// 🔒 Todas las rutas requieren autenticación
router.use(authenticate);

// 📋 Listar áreas (ADMIN y MANAGER)
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getAllAreas);

// 🔍 Obtener área por ID (ADMIN y MANAGER)
router.get('/:id', authorizeRoles('ADMIN', 'MANAGER'), getAreaById);

// ➕ Crear área (solo ADMIN)
router.post('/', authorizeRoles('ADMIN'), createArea);

// ✏️ Actualizar área (ADMIN y MANAGER)
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateArea);

// 🗑️ Eliminar área (solo ADMIN)
router.delete('/:id', authorizeRoles('ADMIN'), deleteArea);

export default router;