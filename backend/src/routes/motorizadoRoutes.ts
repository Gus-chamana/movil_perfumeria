import { Router } from 'express';
import { 
  getShipments, 
  acceptShipment, 
  updateShipmentStatus, 
  getHistory, 
  getProfile, 
  updateProfile 
} from '../controllers/motorizadoController';
import { authMiddleware } from '../middleware/authMiddleware';
import { motorizadoMiddleware } from '../middleware/motorizadoMiddleware';

const router = Router();

// Aplicar Middleware de Autenticación y de Motorizado globalmente para todo este enrutador
router.use(authMiddleware);
router.use(motorizadoMiddleware);

// A. Ruta para obtener listado de envíos (Activos y Disponibles)
router.get('/shipments', getShipments);

// B. Ruta para aceptar/adjudicarse un envío sin motorizado
router.post('/shipments/:id/accept', acceptShipment);

// C. Ruta para actualizar el estado de un envío (ej: PREPARANDO -> EN_RUTA -> ENTREGADO)
router.put('/shipments/:id/status', updateShipmentStatus);

// D. Ruta para historial de envíos completados
router.get('/history', getHistory);

// E. Rutas para el perfil logístico del motorizado
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
