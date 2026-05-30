import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import adminRoutes from './routes/adminRoutes';
import motorizadoRoutes from './routes/motorizadoRoutes';

const app: Application = express();

// Middlewares Globales de Seguridad y Procesamiento
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger para visualizar las peticiones HTTP entrantes en tiempo real
app.use(morgan('dev'));

// Registro de Rutas Modulares
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/motorizado', motorizadoRoutes);

// Ruta Base de Prueba para verificar estado de salud
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: '¡Bienvenido a la API Premium de Noir Essence!',
    status: 'online',
    version: '1.0.0'
  });
});

// Middleware Global de Captura de Errores (SOLID)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error del Servidor]: ${err.stack || err.message}`);
  res.status(500).json({
    error: 'Ocurrió un error interno en el servidor.',
    message: err.message
  });
});

export default app;
