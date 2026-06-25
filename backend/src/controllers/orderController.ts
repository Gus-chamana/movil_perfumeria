import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Endpoint para crear un nuevo pedido (Order + Items + Pago + Envío) en transacción segura
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    const { cart, deliveryAddress, receiverName, receiverDni, paymentMethod } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso no autorizado. Por favor, inicia sesión.' });
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0 || !deliveryAddress || !receiverName || !receiverDni || !paymentMethod) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para procesar la orden.' });
    }

    // Calcular el precio total final del pedido basándose en los items
    const totalAmount = cart.reduce((acc: number, item: any) => {
      return acc + (Number(item.price) * Number(item.quantity));
    }, 0);

    const ordenId = crypto.randomUUID();
    const pagoId = crypto.randomUUID();
    const envioId = crypto.randomUUID();
    const numeroTracking = `NE-${Math.floor(100000 + Math.random() * 900000)}`; // Formato: NE-847291

    // Ejecutar transacciones atómicas de Prisma para garantizar consistencia de datos
    const nuevaOrden = await prisma.$transaction(async (tx) => {
      // A. Crear la cabecera de la Orden
      const order = await tx.ordenes.create({
        data: {
          id: ordenId,
          usuario_id: usuarioId,
          estado: 'CREADO',
          precio_total: totalAmount,
          direccion_envio: deliveryAddress,
          receptor_nombre: receiverName,
          receptor_dni: receiverDni,
          updated_at: new Date()
        }
      });

      // B. Crear cada uno de los detalles de compra (Items)
      for (const item of cart) {
        // Validar que el stock sea suficiente
        const variante = await tx.producto_variantes.findUnique({
          where: { id: item.variantId }
        });

        if (!variante || variante.stock < item.quantity) {
          throw new Error(`Stock insuficiente para el artículo SKU ${variante?.sku || 'desconocido'}`);
        }

        // Restar el stock en la base de datos
        await tx.producto_variantes.update({
          where: { id: item.variantId },
          data: {
            stock: variante.stock - item.quantity,
            updated_at: new Date()
          }
        });

        // Crear registro en la tabla relacional 'detalle_orden'
        await tx.detalle_orden.create({
          data: {
            id: crypto.randomUUID(),
            orden_id: ordenId,
            producto_variante_id: item.variantId,
            cantidad: item.quantity,
            precio_unitario: item.price
          }
        });
      }

      // C. Registrar la transacción de Pago
      await tx.pagos.create({
        data: {
          id: pagoId,
          orden_id: ordenId,
          metodo_pago: paymentMethod, // 'YAPE' | 'PLIN' | 'TARJETA'
          monto: totalAmount,
          estado: 'APROBADO', // Pago simulado aprobado de inmediato
          transaccion_id: `TX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
        }
      });

      // D. Crear la guía de envío y tracking logístico inicial
      await tx.envios.create({
        data: {
          id: envioId,
          orden_id: ordenId,
          numero_tracking: numeroTracking,
          estado_actual: 'CREADO',
          tiempo_estimado: '30 - 45 min',
          updated_at: new Date()
        }
      });

      // E. Registrar el primer estado histórico en 'envio_estados'
      await tx.envio_estados.create({
        data: {
          id: crypto.randomUUID(),
          envio_id: envioId,
          estado: 'CREADO'
        }
      });

      return order;
    });

    res.status(201).json({
      message: '¡Pedido registrado con éxito absoluto!',
      orderId: nuevaOrden.id,
      trackingNumber: numeroTracking,
      total: totalAmount
    });
  } catch (error: any) {
    console.error('[Error en createOrder]:', error);
    res.status(500).json({ error: error.message || 'Ocurrió un error al procesar el pedido.' });
  }
};

// 2. Endpoint para obtener la bitácora logística y datos del motorizado en tiempo real (Tracking)
export const getOrderTracking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // ID de la orden

    // Buscar envío asociado a la orden en Supabase
    const envio = await prisma.envios.findFirst({
      where: { orden_id: id },
      include: {
        envio_estados: {
          orderBy: { fecha: 'desc' }
        },
        motorizados: true,
        ordenes: true
      }
    });

    if (!envio) {
      return res.status(404).json({ error: 'No se encontraron datos de envío para el pedido especificado.' });
    }

    // Para alimentar la línea de tiempo con motorizados reales, si no hay motorizado asignado, le asignamos uno por defecto
    let motorizadoAsignado = envio.motorizados;

    if (!motorizadoAsignado) {
      // Buscar si existe algún motorizado registrado en Supabase
      let motorizado = await prisma.motorizados.findFirst({ where: { activo: true } });

      if (!motorizado) {
        // Si no hay motorizados registrados en tu Supabase, creamos una cuenta semilla de motorizado
        const motorizadoId = crypto.randomUUID();
        
        // El motorizado en la base de datos hereda de un usuario, creamos el usuario motorizado primero
        const userMail = `motorizado.seed@noirenssence.com`;
        let userMoto = await prisma.usuarios.findUnique({ where: { email: userMail } });
        
        if (!userMoto) {
          userMoto = await prisma.usuarios.create({
            data: {
              id: motorizadoId,
              email: userMail,
              password: bcrypt.hashSync('MotorizadoSeed2026*', 10),
              rol: 'MOTORIZADO',
              updated_at: new Date()
            }
          });
        }

        motorizado = await prisma.motorizados.create({
          data: {
            id: userMoto.id,
            nombre: 'Mateo Silva',
            telefono: '+51 984 729 105',
            placa_vehiculo: 'Placa NG-5830',
            activo: true,
            updated_at: new Date()
          }
        });
      }

      // Asignar físicamente el motorizado al envío en Supabase
      const envioActualizado = await prisma.envios.update({
        where: { id: envio.id },
        data: {
          motorizado_id: motorizado.id,
          estado_actual: 'PREPARANDO', // Cambiamos de estado a PREPARANDO al asignarse
          updated_at: new Date()
        },
        include: {
          envio_estados: true,
          motorizados: true,
          ordenes: true
        }
      });

      // Registrar el nuevo estado en el histórico
      await prisma.envio_estados.create({
        data: {
          id: crypto.randomUUID(),
          envio_id: envio.id,
          estado: 'PREPARANDO'
        }
      });

      motorizadoAsignado = envioActualizado.motorizados;
    }

    // Refrescar el envío para traer la línea de tiempo completa
    const envioFinal = await prisma.envios.findUnique({
      where: { id: envio.id },
      include: {
        envio_estados: {
          orderBy: { fecha: 'asc' } // Orden cronológico para la línea de tiempo
        },
        motorizados: true,
        ordenes: true
      }
    });

    res.status(200).json({
      orderId: envioFinal?.orden_id,
      trackingNumber: envioFinal?.numero_tracking,
      estimatedTime: envioFinal?.tiempo_estimado || '30 - 45 min',
      currentStatus: envioFinal?.estado_actual,
      courier: envioFinal?.motorizados ? {
        name: envioFinal.motorizados.nombre,
        phone: envioFinal.motorizados.telefono,
        plate: envioFinal.motorizados.placa_vehiculo
      } : null,
      timeline: envioFinal?.envio_estados.map((e) => ({
        status: e.estado, // 'CREADO' | 'PREPARANDO' | 'EN_RUTA' | 'ENTREGADO'
        date: e.fecha
      }))
    });
  } catch (error) {
    console.error('[Error en getOrderTracking]:', error);
    res.status(500).json({ error: 'Ocurrió un error al consultar el tracking del pedido.' });
  }
};
