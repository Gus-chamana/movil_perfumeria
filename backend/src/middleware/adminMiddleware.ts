import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

// Middleware de autorización exclusivo para el rol de ADMINISTRADOR
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user || user.rol !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren privilegios de Administrador para realizar esta acción.' 
    });
  }

  next();
};
