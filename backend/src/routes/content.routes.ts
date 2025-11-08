// backend/src/routes/content.routes.ts
import { Router } from 'express';
import {
  getAllContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  assignContentToScreens,
  getContentForScreen,
} from '../controllers/content.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// 📺 Contenido para pantallas (público con código)
router.get('/screen/:code', getContentForScreen);

// 🔒 Todas las demás rutas requieren autenticación
router.use(authenticate);

// 📋 Listar contenido (ADMIN y MANAGER)
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getAllContent);

// 🔍 Obtener por ID (ADMIN y MANAGER)
router.get('/:id', authorizeRoles('ADMIN', 'MANAGER'), getContentById);

// ➕ Crear contenido (ADMIN y MANAGER)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createContent);

// ✏️ Actualizar contenido (ADMIN y MANAGER)
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateContent);

// 🗑️ Eliminar contenido (ADMIN y MANAGER)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), deleteContent);

// 🔗 Asignar contenido a pantallas (ADMIN y MANAGER)
router.post('/:id/assign', authorizeRoles('ADMIN', 'MANAGER'), assignContentToScreens);

export default router;