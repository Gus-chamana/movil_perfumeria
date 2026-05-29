import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  toggleFavorite, 
  getFavorites 
} from '../controllers/product.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Rutas públicas del catálogo
router.get('/', getProducts);
router.get('/:id', getProductById);

// Rutas protegidas de favoritos
router.get('/favorites/list', authenticateToken, getFavorites);
router.post('/:id/favorite', authenticateToken, toggleFavorite);

export default router;
