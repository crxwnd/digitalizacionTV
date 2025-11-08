// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

// Importar rutas
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import areasRoutes from './routes/areas.routes';
import screensRoutes from './routes/screens.routes';
import contentRoutes from './routes/content.routes';
import notificationsRoutes from './routes/notifications.routes';

// Importar utilidades
import { startOfflineChecker } from './utils/checkOfflineScreens';

const app = express();
const PORT = process.env.PORT || 5000;

// 🔧 Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 📁 Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 📋 Rutas
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de usuarios (solo ADMIN)
app.use('/api/users', usersRoutes);

// Rutas de áreas (ADMIN y MANAGER)
app.use('/api/areas', areasRoutes);

// Rutas de pantallas (ADMIN y MANAGER)
app.use('/api/screens', screensRoutes);

// Rutas de contenido (ADMIN y MANAGER)
app.use('/api/content', contentRoutes);

// Rutas de notificaciones (ADMIN y MANAGER)
app.use('/api/notifications', notificationsRoutes);

// Ruta 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor backend escuchando en puerto', PORT);
  console.log('📍 Health check: http://localhost:' + PORT + '/health');
  console.log('🔐 Auth: http://localhost:' + PORT + '/api/auth');
  console.log('📁 Uploads: http://localhost:' + PORT + '/uploads');
  
  // Iniciar el checker de pantallas offline
  startOfflineChecker();
});