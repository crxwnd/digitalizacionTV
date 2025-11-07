// backend/src/index.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta de heartbeat para las pantallas (sin autenticación)
app.post('/api/screens/heartbeat/:code', (req, res) => {
  const { code } = req.params;
  console.log(`💓 Heartbeat recibido de pantalla: ${code}`);
  res.json({ 
    success: true, 
    screen: { code, online: true },
    message: 'Heartbeat registrado correctamente'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en puerto ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
