import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

// Middleware de autorización exclusivo para el rol de MOTORIZADO (Repartidor)
export const motorizadoMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user || user.rol !== 'MOTORIZADO') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren privilegios de Motorizado/Repartidor para realizar esta acción.' 
    });
  }

  next();
};
