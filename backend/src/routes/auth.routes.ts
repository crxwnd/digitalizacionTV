// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { login, getProfile, verifyToken } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// 🔑 Rutas públicas (sin autenticación)
router.post('/login', login);

// 🔒 Rutas protegidas (requieren autenticación)
router.get('/profile', authenticate, getProfile);
router.get('/verify', authenticate, verifyToken);

export default router;