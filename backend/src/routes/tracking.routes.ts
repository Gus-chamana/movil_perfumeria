import { Router } from 'express';
import { 
  getOrderTracking, 
  assignMotorizado, 
  updateTrackingStatus,
  getMotorizadosList
} from '../controllers/tracking.controller';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Todas las rutas de tracking requieren autenticación
router.use(authenticateToken);

// Listar motorizados (solo Administradores)
router.get('/motorizados', requireRole([Role.ADMIN]), getMotorizadosList);

// Clientes, Admins y Motorizados pueden ver el tracking
router.get('/:id/tracking', getOrderTracking);

// Solo administradores pueden asignar motorizados
router.put('/:id/assign', requireRole([Role.ADMIN]), assignMotorizado);

// Administradores y Motorizados pueden actualizar el estado del envío
router.put('/:id/status', requireRole([Role.ADMIN, Role.MOTORIZADO]), updateTrackingStatus);

export default router;
