import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/environment';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const saltRounds = 10;

export const registerStep1 = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, nombre, apellidoPaterno, apellidoMaterno, dni } = req.body;

    if (!email || !password || !nombre || !apellidoPaterno || !dni) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos obligatorios (email, password, nombre, apellidoPaterno, dni) son requeridos.'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El correo electrónico ya está registrado.'
      });
    }

    // Verificar si el DNI ya existe
    const existingDni = await prisma.datosPersonales.findUnique({
      where: { dni }
    });

    if (existingDni) {
      return res.status(400).json({
        success: false,
        error: 'El DNI ya está registrado.'
      });
    }

    // Cifrar contraseña
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario y sus datos personales en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.usuario.create({
        data: {
          email,
          password: passwordHash,
          rol: Role.CLIENTE
        }
      });

      const newDetails = await tx.datosPersonales.create({
        data: {
          usuarioId: newUser.id,
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          dni
        }
      });

      return { user: newUser, details: newDetails };
    });

    // Generar token JWT para permitir continuar con el Paso 2
    const token = jwt.sign(
      { id: result.user.id, email: result.user.email, rol: result.user.rol },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Paso 1 completado con éxito. Por favor continúe al Paso 2 para registrar su dirección.',
      data: {
        token,
        usuario: {
          id: result.user.id,
          email: result.user.email,
          rol: result.user.rol,
          nombre: result.details.nombre,
          apellidoPaterno: result.details.apellidoPaterno,
          dni: result.details.dni
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

export const registerStep2 = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.id;
    const { direccion, departamento, provincia, distrito, referencia } = req.body;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado.'
      });
    }

    if (!direccion || !departamento || !provincia || !distrito) {
      return res.status(400).json({
        success: false,
        error: 'Los campos direccion, departamento, provincia y distrito son requeridos.'
      });
    }

    // Agregar la dirección y marcarla como principal
    const newAddress = await prisma.direccion.create({
      data: {
        usuarioId,
        direccion,
        departamento,
        provincia,
        distrito,
        referencia,
        esPrincipal: true // Al ser el registro inicial, se marca como principal
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Paso 2 completado con éxito. Registro finalizado.',
      data: {
        direccion: newAddress
      }
    });

  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'El email y la contraseña son requeridos.'
      });
    }

    // Buscar usuario con sus datos personales y direcciones
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: {
        datosPersonales: true,
        direcciones: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas.'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas.'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        token,
        usuario: {
          id: user.id,
          email: user.email,
          rol: user.rol,
          datosPersonales: user.datosPersonales,
          direcciones: user.direcciones
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado.'
      });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        datosPersonales: true,
        direcciones: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado.'
      });
    }

    // Evitar exponer la contraseña
    const { password, ...safeUser } = user;

    return res.json({
      success: true,
      data: safeUser
    });

  } catch (error) {
    next(error);
  }
};
