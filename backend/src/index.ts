// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

//Importacion de rutas
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import areasRoutes from './routes/areas.routes';
import screensRoutes from './routes/screens.routes';
import contentRoutes from './routes/content.routes';
import notificationsRoutes from './routes/notifications.routes';
import monitorRoutes from './routes/monitor.routes';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

//Configurar Socket.IO para WebSockets
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

//Configurar directorio de uploads
const uploadPath = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

//Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir archivos estáticos (contenido multimedia)
app.use('/uploads', express.static(uploadPath));

//Rutas
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    features: {
      websockets: true,
      fileUpload: true,
      monitoring: true,
      notifications: true
    }
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

// Rutas de contenido (gestión de multimedia)
app.use('/api/content', contentRoutes);

// Rutas de notificaciones/avisos
app.use('/api/notifications', notificationsRoutes);

// Rutas de monitoreo
app.use('/api/monitor', monitorRoutes);

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  // Unirse a sala de pantalla específica
  socket.on('join-screen', (screenCode) => {
    socket.join(`screen-${screenCode}`);
    console.log(`📺 Socket ${socket.id} unido a pantalla ${screenCode}`);
  });

  // Unirse a sala de área
  socket.on('join-area', (areaId) => {
    socket.join(`area-${areaId}`);
    console.log(`🏢 Socket ${socket.id} unido a área ${areaId}`);
  });

  // Actualizar contenido en tiempo real
  socket.on('update-content', (data) => {
    const { screenCode, content } = data;
    io.to(`screen-${screenCode}`).emit('content-updated', content);
  });

  // Enviar notificación/aviso
  socket.on('send-notification', (data) => {
    const { areaId, notification } = data;
    io.to(`area-${areaId}`).emit('notification-received', notification);
  });

  // Heartbeat de pantalla
  socket.on('screen-heartbeat', (data) => {
    const { screenCode, status } = data;
    io.emit('screen-status', { screenCode, status, timestamp: new Date() });
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Ruta 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Exportar io para usarlo en otros módulos
export { io };

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log('🚀 Servidor backend escuchando en puerto', PORT);
  console.log('📍 Health check: http://localhost:' + PORT + '/health');
  console.log('🔐 Auth: http://localhost:' + PORT + '/api/auth');
  console.log('🔌 WebSocket server activo');
});