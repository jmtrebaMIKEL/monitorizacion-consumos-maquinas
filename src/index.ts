import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import apiRoutes from './controllers/apiRoutes';
import { initDatabase } from './db/store';
import { testConnection } from './db/connection';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Fallback to Dashboard
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
async function start() {
  console.log('⚡ Iniciando Sistema de Monitorización Energética...');
  
  // Test connection and initialize schema
  const dbStatus = await testConnection();
  console.log(`🔌 Estado Base de Datos: ${dbStatus.provider} - ${dbStatus.message}`);
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Servidor activo en: http://localhost:${PORT}`);
    console.log(`📊 Dashboard Web:      http://localhost:${PORT}/`);
    console.log(`📡 API Endpoints:     http://localhost:${PORT}/api/status`);
    console.log(`                      POST http://localhost:${PORT}/api/consumption`);
    console.log(`                      GET  http://localhost:${PORT}/api/analytics`);
    console.log(`                      GET  http://localhost:${PORT}/api/alarms`);
    console.log(`======================================================\n`);
  });
}

if (!process.env.VERCEL) {
  start().catch(err => {
    console.error('❌ Error fatal al iniciar el servidor:', err);
  });
}

export default app;
