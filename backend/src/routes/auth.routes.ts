import { Router } from 'express';
import { 
  registerStep1, 
  registerStep2, 
  login, 
  getProfile 
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Rutas públicas de autenticación
router.post('/register-step1', registerStep1);
router.post('/login', login);

// Rutas protegidas (requieren token)
router.post('/register-step2', authenticateToken, registerStep2);
router.get('/profile', authenticateToken, getProfile);

export default router;
