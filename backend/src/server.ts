import dotenv from 'dotenv';
import app from './app';

// Cargar variables de entorno del archivo .env
dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
  ======================================================
  ✨ Servidor Noir Essence iniciado correctamente ✨
  🚀 Escuchando en el puerto: http://localhost:${PORT}
  🌍 Entorno: ${process.env.NODE_ENV || 'development'}
  ======================================================
  `);
});

// Manejo de apagado gracioso (Graceful Shutdown) - Solo en producción para evitar cierres inmediatos en desarrollo en Windows
if (process.env.NODE_ENV === 'production') {
  const gracefulShutdown = () => {
    console.log('\n[Apagado] Apagando el servidor HTTP de forma controlada...');
    server.close(() => {
      console.log('[Apagado] Servidor HTTP cerrado con éxito.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}
