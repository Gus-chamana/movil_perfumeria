import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  toggleFavorite, 
  getFavorites,
  createProduct
} from '../controllers/product.controller';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Rutas públicas del catálogo
router.get('/', getProducts);
router.get('/:id', getProductById);

// Crear producto (solo Administradores)
router.post('/', authenticateToken, requireRole([Role.ADMIN]), createProduct);

// Rutas protegidas de favoritos
router.get('/favorites/list', authenticateToken, getFavorites);
router.post('/:id/favorite', authenticateToken, toggleFavorite);

export default router;
