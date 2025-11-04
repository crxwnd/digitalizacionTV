import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Importar rutas
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import areasRoutes from './routes/areas.routes';
import screensRoutes from './routes/screens.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rutas
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend funcionando correctamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/screens', screensRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en puerto ${PORT}`);
});