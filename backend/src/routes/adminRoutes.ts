import { Router } from 'express';
import { 
  getDashboardStats, 
  getUsers, 
  updateUserRole, 
  deleteUser, 
  getMotorizadosList, 
  updateMotorizadoStatus, 
  updateProductVariantStock,
  createProduct,
  createAdminUser,
  updateAdminUser,
  updateMotorizadoDetails
} from '../controllers/adminController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

// Aplicar Middleware de Autenticación y de Administrador de forma global para todo este enrutador
router.use(authMiddleware);
router.use(adminMiddleware);

// A. Ruta para estadísticas del Dashboard
router.get('/stats', getDashboardStats);

// B. Rutas para Gestión de Usuarios
router.get('/users', getUsers);
router.post('/users', createAdminUser);
router.put('/users/:id', updateAdminUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);


// C. Rutas para Gestión de Motorizados
router.get('/motorizados', getMotorizadosList);
router.put('/motorizados/:id', updateMotorizadoDetails);
router.put('/motorizados/:id/status', updateMotorizadoStatus);


// D. Rutas para Modificación e Inserción de Productos/Stock
router.put('/products/variants/:id/stock', updateProductVariantStock);
router.post('/products', createProduct);

export default router;
