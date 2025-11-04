// backend/src/routes/users.routes.ts
import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from '../controllers/users.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// 🔒 Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

// 📋 CRUD de usuarios
router.get('/', getAllUsers);              // Listar todos
router.get('/:id', getUserById);           // Obtener por ID
router.post('/', createUser);              // Crear nuevo
router.put('/:id', updateUser);            // Actualizar
router.delete('/:id', deleteUser);         // Eliminar
router.patch('/:id/toggle', toggleUserStatus); // Activar/Desactivar

export default router;