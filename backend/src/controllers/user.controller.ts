import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

const saltRounds = 10;

export const adminCreateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      email, 
      password, 
      rol, 
      nombre, 
      apellidoPaterno, 
      apellidoMaterno, 
      dni, 
      telefono, 
      placaVehiculo 
    } = req.body;

    if (!email || !password || !rol || !nombre) {
      return res.status(400).json({
        success: false,
        error: 'Los campos básicos (email, password, rol, nombre) son requeridos.'
      });
    }

    if (rol !== Role.ADMIN && rol !== Role.MOTORIZADO) {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden crear usuarios con rol ADMIN o MOTORIZADO.'
      });
    }

    // Validaciones específicas
    if (rol === Role.ADMIN) {
      if (!apellidoPaterno || !apellidoMaterno || !dni) {
        return res.status(400).json({
          success: false,
          error: 'Para crear un Administrador se requiere apellidoPaterno, apellidoMaterno y DNI.'
        });
      }
    } else if (rol === Role.MOTORIZADO) {
      if (!telefono || !placaVehiculo) {
        return res.status(400).json({
          success: false,
          error: 'Para crear un Motorizado se requiere teléfono y placa de vehículo.'
        });
      }
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

    // Verificar DNI si es admin
    if (rol === Role.ADMIN) {
      const existingDni = await prisma.datosPersonales.findUnique({
        where: { dni }
      });
      if (existingDni) {
        return res.status(400).json({
          success: false,
          error: 'El DNI ya está registrado.'
        });
      }
    }

    // Cifrar contraseña
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const created = await prisma.$transaction(async (tx) => {
      const newUser = await tx.usuario.create({
        data: {
          email,
          password: passwordHash,
          rol: rol as Role
        }
      });

      if (rol === Role.ADMIN) {
        await tx.datosPersonales.create({
          data: {
            usuarioId: newUser.id,
            nombre,
            apellidoPaterno: apellidoPaterno!,
            apellidoMaterno,
            dni: dni!
          }
        });
      } else if (rol === Role.MOTORIZADO) {
        await tx.motorizado.create({
          data: {
            id: newUser.id,
            nombre,
            telefono: telefono!,
            placaVehiculo: placaVehiculo!,
            activo: true
          }
        });
      }

      return newUser;
    });

    return res.status(201).json({
      success: true,
      message: `Usuario con rol ${rol} creado con éxito.`,
      data: {
        id: created.id,
        email: created.email,
        rol: created.rol
      }
    });

  } catch (error) {
    next(error);
  }
};
