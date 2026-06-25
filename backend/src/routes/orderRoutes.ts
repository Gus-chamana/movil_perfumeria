import { Router } from 'express';
import { createOrder, getOrderTracking } from '../controllers/orderController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Endpoint privado para crear una orden de compra (Protegido por JWT)
router.post('/', authMiddleware, createOrder);

// Endpoint privado para obtener el seguimiento logístico en tiempo real (Protegido por JWT)
router.get('/:id/tracking', authMiddleware, getOrderTracking);

export default router;
