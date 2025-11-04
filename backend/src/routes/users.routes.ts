import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/users.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// Solo Admin puede gestionar usuarios
router.use(authenticate, authorizeRoles('ADMIN'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;