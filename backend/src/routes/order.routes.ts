import { Router } from 'express';
import { 
  createOrder, 
  getOrderHistory, 
  getOrderById 
} from '../controllers/order.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Todas las rutas de órdenes requieren autenticación
router.use(authenticateToken);

router.post('/', createOrder);
router.get('/history', getOrderHistory);
router.get('/:id', getOrderById);

export default router;
