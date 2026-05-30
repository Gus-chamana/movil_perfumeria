import { Router } from 'express';
import { adminCreateUser } from '../controllers/user.controller';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Todas las rutas de usuarios administrativas requieren autenticación de administrador
router.use(authenticateToken);
router.use(requireRole([Role.ADMIN]));

// Crear administrador o motorizado
router.post('/admin/create', adminCreateUser);

export default router;
