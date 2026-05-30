import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Endpoint de registro público
router.post('/register', register);

// Endpoint de inicio de sesión público
router.post('/login', login);

// Endpoint de perfil privado de usuario (Protegido por JWT)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

export default router;
