import { Router } from 'express';
import {
  getScreens,
  createScreen,
  updateScreen,
  deleteScreen,
  approveScreen,
  heartbeat,
} from '../controllers/screens.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// Heartbeat público (para las pantallas)
router.post('/heartbeat', heartbeat);

// Rutas protegidas
router.get('/', authenticate, getScreens);
router.post('/', authenticate, createScreen);
router.put('/:id', authenticate, updateScreen);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), deleteScreen);

// Solo Admin puede aprobar pantallas
router.patch('/:id/approve', authenticate, authorizeRoles('ADMIN'), approveScreen);

export default router;