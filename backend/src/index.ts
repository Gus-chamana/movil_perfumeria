import express from 'express';
import cors from 'cors';
import { env } from './config/environment';
import { errorHandler } from './middlewares/error';
import apiRoutes from './routes';

const app = express();

// Configuración de Middlewares globales
app.use(cors());
app.use(express.json());

// Ruta de estado de la API
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Noir Essence Luxury Perfumes API is running.',
    timestamp: new Date()
  });
});

// Registrar rutas de la API bajo el prefijo /api
app.use('/api', apiRoutes);

// Manejador centralizado de errores (Debe ser el último middleware registrado)
app.use(errorHandler);

// Iniciar servidor de escucha
app.listen(env.PORT, () => {
  console.log(`===========================================`);
  console.log(`  Noir Essence Backend Server running      `);
  console.log(`  Local: http://localhost:${env.PORT}     `);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===========================================`);
});
