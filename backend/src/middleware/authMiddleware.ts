import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extender la interfaz Request de Express para poder inyectar la propiedad "user"
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    rol: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token de seguridad.' });
  }

  // Extraer el token de la cabecera (Bearer <token>)
  const token = authHeader.split(' ')[1];

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'NoirEssenceSuperSecureSecretKey2026Token';
    
    // Verificar y decodificar el token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; rol: string };
    
    // Inyectar el usuario autenticado en el objeto Request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol
    };

    next();
  } catch (error) {
    console.error('[Error de Validación JWT]:', error);
    return res.status(401).json({ error: 'Sesión inválida o expirada. Por favor, vuelve a iniciar sesión.' });
  }
};
