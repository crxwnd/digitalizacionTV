// backend/src/routes/monitor.routes.ts
import { Router } from 'express';
import {
  getAreaMonitor,
  getGlobalMonitor,
  getScreenCapture,
  remoteControl,
  getScreenLogs,
  getRealTimeStatus,
} from '../controllers/monitor.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// 🔒 Todas las rutas requieren autenticación
router.use(authenticate);

// 🌍 Monitor global
router.get('/global', authorizeRoles('ADMIN', 'MANAGER'), getGlobalMonitor);

// 🏢 Monitor de área específica
router.get('/area/:areaId', authorizeRoles('ADMIN', 'MANAGER'), getAreaMonitor);

// 🔄 Estado en tiempo real
router.get('/realtime', authorizeRoles('ADMIN', 'MANAGER'), getRealTimeStatus);

// 📸 Captura de pantalla
router.get('/capture/:screenCode', authorizeRoles('ADMIN', 'MANAGER'), getScreenCapture);

// 🎮 Control remoto
router.post('/control/:screenCode', authorizeRoles('ADMIN', 'MANAGER'), remoteControl);

// 📊 Logs de pantalla
router.get('/logs/:screenCode', authorizeRoles('ADMIN', 'MANAGER'), getScreenLogs);

export default router;
