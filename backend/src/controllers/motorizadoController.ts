import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Obtener Envíos (Activos asignados y Disponibles sin asignar)
export const getShipments = async (req: AuthRequest, res: Response) => {
  try {
    const motorizadoId = req.user?.id;
    if (!motorizadoId) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    // A. Envíos activos asignados a este motorizado (no entregados aún)
    const activeShipments = await prisma.envios.findMany({
      where: {
        motorizado_id: motorizadoId,
        NOT: { estado_actual: 'ENTREGADO' }
      },
      include: {
        ordenes: {
          include: {
            usuarios: {
              include: { datos_personales: true }
            }
          }
        },
        envio_estados: {
          orderBy: { fecha: 'desc' }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    // B. Envíos disponibles en Lima Metropolitana sin motorizado asignado (para tomar el pedido)
    const availableShipments = await prisma.envios.findMany({
      where: {
        motorizado_id: null,
        estado_actual: { in: ['CREADO', 'PREPARANDO'] }
      },
      include: {
        ordenes: {
          include: {
            usuarios: {
              include: { datos_personales: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Darle un formato limpio para el frontend
    const format = (list: any[]) => list.map(e => ({
      id: e.id,
      ordenId: e.orden_id,
      trackingNumber: e.numero_tracking,
      status: e.estado_actual,
      estimatedTime: e.tiempo_estimado || '30 - 45 min',
      address: e.ordenes?.direccion_envio || 'No especificada',
      receptor: e.ordenes?.receptor_nombre || 'N/A',
      receptorDni: e.ordenes?.receptor_dni || 'N/A',
      total: Number(e.ordenes?.precio_total || 0),
      clientName: e.ordenes?.usuarios?.datos_personales 
        ? `${e.ordenes.usuarios.datos_personales.nombre} ${e.ordenes.usuarios.datos_personales.apellido_paterno}`
        : 'Cliente Vip',
      clientPhone: e.ordenes?.usuarios?.datos_personales?.telefono || '+51 900 000 000'
    }));

    res.status(200).json({
      active: format(activeShipments),
      available: format(availableShipments)
    });
  } catch (error) {
    console.error('[Error en getShipments]:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener la bitácora de envíos.' });
  }
};

// 2. Aceptar un Envío disponible (Auto-asignación)
export const acceptShipment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // ID del envío
    const motorizadoId = req.user?.id;

    if (!motorizadoId) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    // Verificar si el envío ya tiene un motorizado
    const envio = await prisma.envios.findUnique({
      where: { id },
      include: { ordenes: true }
    });

    if (!envio) {
      return res.status(404).json({ error: 'El envío especificado no existe.' });
    }

    if (envio.motorizado_id) {
      return res.status(400).json({ error: 'Este envío ya ha sido tomado por otro motorizado.' });
    }

    // Actualizar de forma segura en transacción
    await prisma.$transaction(async (tx) => {
      // A. Asignar motorizado y cambiar estado a PREPARANDO (en proceso de despacho)
      await tx.envios.update({
        where: { id },
        data: {
          motorizado_id: motorizadoId,
          estado_actual: 'PREPARANDO',
          updated_at: new Date()
        }
      });

      // B. Actualizar estado de la cabecera del Pedido
      await tx.ordenes.update({
        where: { id: envio.orden_id },
        data: { estado: 'PREPARANDO', updated_at: new Date() }
      });

      // C. Registrar el estado en el historial logístico
      await tx.envio_estados.create({
        data: {
          id: crypto.randomUUID(),
          envio_id: id,
          estado: 'PREPARANDO'
        }
      });
    });

    res.status(200).json({ message: 'Envío aceptado y asignado correctamente a tu ruta.' });
  } catch (error) {
    console.error('[Error en acceptShipment]:', error);
    res.status(500).json({ error: 'No se pudo aceptar el envío.' });
  }
};

// 3. Actualizar el Estado de Entrega de un Envío
export const updateShipmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // ID del envío
    const { newStatus } = req.body; // 'PREPARANDO' | 'EN_RUTA' | 'ENTREGADO'
    const motorizadoId = req.user?.id;

    if (!motorizadoId) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    if (!newStatus || !['PREPARANDO', 'EN_RUTA', 'ENTREGADO'].includes(newStatus)) {
      return res.status(400).json({ error: 'El nuevo estado logístico especificado es inválido.' });
    }

    // Verificar propiedad del envío
    const envio = await prisma.envios.findUnique({
      where: { id }
    });

    if (!envio) {
      return res.status(404).json({ error: 'El envío no existe.' });
    }

    if (envio.motorizado_id !== motorizadoId) {
      return res.status(403).json({ error: 'No estás autorizado para gestionar este envío.' });
    }

    // Transacción atómica de cambio de estado logístico
    await prisma.$transaction(async (tx) => {
      // A. Actualizar estado de la Guía de Envío
      await tx.envios.update({
        where: { id },
        data: {
          estado_actual: newStatus,
          updated_at: new Date()
        }
      });

      // B. Sincronizar estado de la Orden
      await tx.ordenes.update({
        where: { id: envio.orden_id },
        data: {
          estado: newStatus,
          updated_at: new Date()
        }
      });

      // C. Agregar registro histórico en 'envio_estados'
      await tx.envio_estados.create({
        data: {
          id: crypto.randomUUID(),
          envio_id: id,
          estado: newStatus
        }
      });
    });

    res.status(200).json({ message: `Estado del envío actualizado correctamente a ${newStatus}.` });
  } catch (error) {
    console.error('[Error en updateShipmentStatus]:', error);
    res.status(500).json({ error: 'Ocurrió un error al actualizar el estado de entrega.' });
  }
};

// 4. Obtener Historial de Envíos del Motorizado (Entregados)
export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const motorizadoId = req.user?.id;
    if (!motorizadoId) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    const completedShipments = await prisma.envios.findMany({
      where: {
        motorizado_id: motorizadoId,
        estado_actual: 'ENTREGADO'
      },
      include: {
        ordenes: true
      },
      orderBy: { updated_at: 'desc' }
    });

    const list = completedShipments.map(e => ({
      id: e.id,
      ordenId: e.orden_id,
      trackingNumber: e.numero_tracking,
      address: e.ordenes?.direccion_envio || 'N/A',
      receptor: e.ordenes?.receptor_nombre || 'N/A',
      total: Number(e.ordenes?.precio_total || 0),
      deliveredAt: e.updated_at
    }));

    res.status(200).json(list);
  } catch (error) {
    console.error('[Error en getHistory]:', error);
    res.status(500).json({ error: 'Ocurrió un error al recuperar tu historial de entregas.' });
  }
};

// 5. Obtener Perfil del Motorizado
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const motorizadoId = req.user?.id;
    const email = req.user?.email;

    if (!motorizadoId) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    // Buscar perfil de motorizado
    let motorizado = await prisma.motorizados.findUnique({
      where: { id: motorizadoId }
    });

    // Si no existe el perfil de motorizado pero el usuario tiene el rol, crearlo de inmediato en caliente
    if (!motorizado) {
      const userDetails = await prisma.datos_personales.findUnique({
        where: { usuario_id: motorizadoId }
      });
      const nombre = userDetails ? `${userDetails.nombre} ${userDetails.apellido_paterno}` : 'Repartidor Concierge';
      
      motorizado = await prisma.motorizados.create({
        data: {
          id: motorizadoId,
          nombre,
          telefono: '+51 900 000 000',
          placa_vehiculo: 'Placa NG-5830',
          activo: true,
          updated_at: new Date()
        }
      });
    }

    res.status(200).json({
      id: motorizado.id,
      nombre: motorizado.nombre,
      telefono: motorizado.telefono,
      placa: motorizado.placa_vehiculo,
      activo: motorizado.activo,
      email: email || 'motorizado@noinessence.com'
    });
  } catch (error) {
    console.error('[Error en getProfile]:', error);
    res.status(500).json({ error: 'Ocurrió un error al cargar tu perfil logístico.' });
  }
};

// 6. Actualizar Perfil de Motorizado
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const motorizadoId = req.user?.id;
    const { telefono, placa, activo } = req.body;

    if (!motorizadoId) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    if (!telefono || !placa) {
      return res.status(400).json({ error: 'El teléfono y la placa del vehículo son requeridos.' });
    }

    const motorizadoActualizado = await prisma.motorizados.update({
      where: { id: motorizadoId },
      data: {
        telefono: telefono.trim(),
        placa_vehiculo: placa.trim(),
        activo: typeof activo === 'boolean' ? activo : true,
        updated_at: new Date()
      }
    });

    res.status(200).json({
      message: 'Tu perfil logístico ha sido actualizado de forma exitosa en Supabase.',
      profile: {
        id: motorizadoActualizado.id,
        nombre: motorizadoActualizado.nombre,
        telefono: motorizadoActualizado.telefono,
        placa: motorizadoActualizado.placa_vehiculo,
        activo: motorizadoActualizado.activo
      }
    });
  } catch (error) {
    console.error('[Error en updateProfile]:', error);
    res.status(500).json({ error: 'Ocurrió un error al guardar tu perfil logístico.' });
  }
};
