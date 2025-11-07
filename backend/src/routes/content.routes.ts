// backend/src/routes/content.routes.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadContent,
  getAllContent,
  deleteContent,
  updateContent,
  createPlaylist,
  assignContentToScreen,
  getContentStats,
} from '../controllers/content.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

// 🔒 Todas las rutas requieren autenticación
router.use(authenticate);

// 📊 Estadísticas de contenido
router.get('/stats', authorizeRoles('ADMIN', 'MANAGER'), getContentStats);

// 📤 Subir contenido
router.post('/upload', 
  authorizeRoles('ADMIN', 'MANAGER'), 
  upload.single('file'),
  uploadContent
);

// 📋 Listar contenido
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getAllContent);

// ✏️ Actualizar contenido
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateContent);

// 🗑️ Eliminar contenido
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), deleteContent);

// 📝 Crear playlist
router.post('/playlist', authorizeRoles('ADMIN', 'MANAGER'), createPlaylist);

// 📺 Asignar contenido a pantalla
router.post('/assign', authorizeRoles('ADMIN', 'MANAGER'), assignContentToScreen);

export default router;
