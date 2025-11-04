import { Router } from 'express';
import {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
} from '../controllers/areas.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todos los usuarios autenticados pueden ver áreas
router.get('/', authenticate, getAreas);

// Solo Admin puede crear/editar/eliminar áreas
router.post('/', authenticate, authorizeRoles('ADMIN'), createArea);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), updateArea);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), deleteArea);

export default router;