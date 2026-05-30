import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { OrderStatus } from '@prisma/client';

export const getOrderTracking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: ordenId } = req.params;

    const envio = await prisma.envio.findUnique({
      where: { ordenId },
      include: {
        motorizado: true,
        estados: {
          orderBy: { fecha: 'asc' }
        },
        orden: {
          select: {
            id: true,
            usuarioId: true,
            estado: true,
            direccionEnvio: true,
            createdAt: true
          }
        }
      }
    });

    if (!envio) {
      return res.status(404).json({
        success: false,
        error: 'Información de envío no encontrada para esta orden.'
      });
    }

    // Autorización básica: El cliente solo puede ver su propio envío
    if (req.user?.rol === 'CLIENTE' && envio.orden.usuarioId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No está autorizado para rastrear esta orden.'
      });
    }

    return res.json({
      success: true,
      data: {
        ordenId: envio.ordenId,
        numeroTracking: envio.numeroTracking,
        estadoActual: envio.estadoActual,
        tiempoEstimado: envio.tiempoEstimado,
        motorizado: envio.motorizado ? {
          nombre: envio.motorizado.nombre,
          telefono: envio.motorizado.telefono,
          placaVehiculo: envio.motorizado.placaVehiculo
        } : null,
        lineaTiempo: envio.estados.map(e => ({
          estado: e.estado,
          fecha: e.fecha
        }))
      }
    });

  } catch (error) {
    next(error);
  }
};

export const assignMotorizado = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: ordenId } = req.params;
    const { motorizadoId } = req.body;

    if (!motorizadoId) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro motorizadoId es requerido.'
      });
    }

    // Verificar si el motorizado existe y está activo
    const motorizado = await prisma.motorizado.findUnique({
      where: { id: motorizadoId }
    });

    if (!motorizado) {
      return res.status(404).json({
        success: false,
        error: 'Motorizado no encontrado.'
      });
    }

    // Buscar el envío
    const envio = await prisma.envio.findUnique({
      where: { ordenId }
    });

    if (!envio) {
      return res.status(404).json({
        success: false,
        error: 'Envío no encontrado para esta orden.'
      });
    }

    // Actualizar el motorizado asignado y cambiar de estado a PREPARANDO si estaba en CREADO
    const nuevoEstado = envio.estadoActual === OrderStatus.CREADO ? OrderStatus.PREPARANDO : envio.estadoActual;

    await prisma.$transaction(async (tx) => {
      await tx.envio.update({
        where: { id: envio.id },
        data: {
          motorizadoId,
          estadoActual: nuevoEstado
        }
      });

      await tx.orden.update({
        where: { id: ordenId },
        data: {
          estado: nuevoEstado
        }
      });

      // Si cambió de estado, registrar en la bitácora
      if (nuevoEstado !== envio.estadoActual) {
        await tx.envioEstado.create({
          data: {
            envioId: envio.id,
            estado: nuevoEstado
          }
        });
      }
    });

    return res.json({
      success: true,
      message: 'Motorizado asignado con éxito.',
      data: {
        ordenId,
        motorizado: {
          nombre: motorizado.nombre,
          telefono: motorizado.telefono,
          placaVehiculo: motorizado.placaVehiculo
        },
        estadoActual: nuevoEstado
      }
    });

  } catch (error) {
    next(error);
  }
};

export const updateTrackingStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: ordenId } = req.params;
    const { estado } = req.body; // CREADO, PREPARANDO, EN_RUTA, ENTREGADO

    if (!estado || !Object.values(OrderStatus).includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado de entrega no válido o no proporcionado.'
      });
    }

    const envio = await prisma.envio.findUnique({
      where: { ordenId }
    });

    if (!envio) {
      return res.status(404).json({
        success: false,
        error: 'Envío no encontrado para esta orden.'
      });
    }

    // Si el usuario es motorizado, validar que sea el motorizado asignado a este envío
    if (req.user?.rol === 'MOTORIZADO' && envio.motorizadoId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado. Solo puede actualizar envíos asignados a su cuenta.'
      });
    }

    // Evitar añadir duplicados consecutivos del mismo estado
    if (envio.estadoActual === estado) {
      return res.status(400).json({
        success: false,
        error: `El envío ya se encuentra en el estado: ${estado}`
      });
    }

    await prisma.$transaction(async (tx) => {
      // Actualizar estado del envío
      await tx.envio.update({
        where: { id: envio.id },
        data: { estadoActual: estado as OrderStatus }
      });

      // Actualizar estado de la orden
      await tx.orden.update({
        where: { id: ordenId },
        data: { estado: estado as OrderStatus }
      });

      // Agregar estado a la bitácora
      await tx.envioEstado.create({
        data: {
          envioId: envio.id,
          estado: estado as OrderStatus
        }
      });
    });

    return res.json({
      success: true,
      message: `Estado de pedido actualizado a: ${estado} con éxito.`,
      data: {
        ordenId,
        estadoActual: estado
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getMotorizadosList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const motorizados = await prisma.motorizado.findMany({
      where: { activo: true }
    });
    return res.json({
      success: true,
      data: motorizados
    });
  } catch (error) {
    next(error);
  }
};

