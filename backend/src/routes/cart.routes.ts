import { Router } from 'express';
import { 
  getCart, 
  addOrUpdateItem, 
  removeItem, 
  clearCart 
} from '../controllers/cart.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Todas las rutas del carrito requieren autenticación
router.use(authenticateToken);

router.get('/', getCart);
router.post('/items', addOrUpdateItem);
router.delete('/items/:itemId', removeItem);
router.delete('/', clearCart);

export default router;
