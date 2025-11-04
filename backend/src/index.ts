// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Importar rutas
import authRoutes from './routes/auth.routes';

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

// Ruta 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor backend escuchando en puerto', PORT);
  console.log('📍 Health check: http://localhost:' + PORT + '/health');
  console.log('🔐 Auth: http://localhost:' + PORT + '/api/auth');
});