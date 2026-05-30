import { Router } from 'express';
import { getProducts, getProductById } from '../controllers/productController';

const router = Router();

// Endpoint de catálogo de perfumes (Soporta query params de filtrado)
router.get('/', getProducts);

// Endpoint para obtener el detalle unitario de un perfume
router.get('/:id', getProductById);

export default router;
