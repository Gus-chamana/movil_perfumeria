import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.id;
    const { 
      direccionEnvioId, 
      nuevaDireccion,
      metodoPago, 
      datosTarjeta, 
      telefonoPago,
      receptorNombre, 
      receptorDni 
    } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }

    if (!metodoPago || !receptorNombre || !receptorDni) {
      return res.status(400).json({
        success: false,
        error: 'Los parámetros metodoPago, receptorNombre y receptorDni son requeridos.'
      });
    }

    // Validar método de pago y sus detalles
    if (metodoPago === 'TARJETA') {
      if (!datosTarjeta || !datosTarjeta.numeroTarjeta || !datosTarjeta.fechaVencimiento || !datosTarjeta.cvv) {
        return res.status(400).json({
          success: false,
          error: 'Para pagos con tarjeta, los campos numeroTarjeta, fechaVencimiento y cvv son requeridos.'
        });
      }
    } else if (metodoPago === 'YAPE' || metodoPago === 'PLIN') {
      if (!telefonoPago) {
        return res.status(400).json({
          success: false,
          error: 'Para pagos con Yape/Plin, el teléfono de pago es requerido.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Método de pago no soportado. Use TARJETA, YAPE o PLIN.'
      });
    }

    // Obtener el carrito
    const cart = await prisma.carrito.findUnique({
      where: { usuarioId },
      include: {
        items: {
          include: {
            variante: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El carrito de compras está vacío.'
      });
    }

    // Ejecutar la creación de la orden en una transacción
    const orderResult = await prisma.$transaction(async (tx) => {
      
      // 1. Validar y descontar stock para cada ítem
      for (const item of cart.items) {
        const v = item.variante;
        if (v.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para el producto variante con SKU: ${v.sku}. Stock disponible: ${v.stock}`);
        }

        // Descontar stock
        await tx.productoVariante.update({
          where: { id: v.id },
          data: { stock: v.stock - item.cantidad }
        });
      }

      // 2. Resolver la dirección de envío
      let finalAddressText = '';
      if (direccionEnvioId) {
        const addr = await tx.direccion.findUnique({
          where: { id: direccionEnvioId }
        });
        if (!addr || addr.usuarioId !== usuarioId) {
          throw new Error('Dirección de envío seleccionada no válida.');
        }
        finalAddressText = `${addr.direccion}, ${addr.distrito}, ${addr.provincia}, ${addr.departamento}`;
      } else if (nuevaDireccion) {
        const { direccion, departamento, provincia, distrito, referencia } = nuevaDireccion;
        if (!direccion || !departamento || !provincia || !distrito) {
          throw new Error('Los campos de la nueva dirección son incompletos.');
        }

        // Crear la dirección en la BD para el usuario
        const createdAddr = await tx.direccion.create({
          data: {
            usuarioId,
            direccion,
            departamento,
            provincia,
            distrito,
            referencia,
            esPrincipal: false
          }
        });
        finalAddressText = `${createdAddr.direccion}, ${createdAddr.distrito}, ${createdAddr.provincia}, ${createdAddr.departamento}`;
      } else {
        throw new Error('Debe proporcionar una direccionEnvioId o los datos de nuevaDireccion.');
      }

      // 3. Calcular montos
      const subtotal = cart.items.reduce((sum, item) => {
        const price = parseFloat(item.variante.precio.toString());
        return sum + (price * item.cantidad);
      }, 0);
      
      const costoEnvio = subtotal > 200 ? 0 : 15.0;
      const total = subtotal + costoEnvio;

      // 4. Crear la Orden
      const order = await tx.orden.create({
        data: {
          usuarioId,
          estado: OrderStatus.CREADO,
          precioTotal: total,
          direccionEnvio: finalAddressText,
          receptorNombre,
          receptorDni
        }
      });

      // 5. Crear los detalles de la Orden
      for (const item of cart.items) {
        await tx.detalleOrden.create({
          data: {
            ordenId: order.id,
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            precioUnit: item.variante.precio
          }
        });
      }

      // 6. Registrar el Pago (Simulado: APROBADO por defecto)
      const txnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await tx.pago.create({
        data: {
          ordenId: order.id,
          metodoPago: metodoPago as PaymentMethod,
          monto: total,
          estado: PaymentStatus.APROBADO,
          transaccionId: txnId
        }
      });

      // 7. Crear el Envío (Tracking)
      const trackingNum = `NX-${Math.floor(1000 + Math.random() * 9000)}`;
      const shipping = await tx.envio.create({
        data: {
          ordenId: order.id,
          numeroTracking: trackingNum,
          estadoActual: OrderStatus.CREADO,
          tiempoEstimado: '30-50 min'
        }
      });

      // Registrar estado inicial en la bitácora de envío
      await tx.envioEstado.create({
        data: {
          envioId: shipping.id,
          estado: OrderStatus.CREADO
        }
      });

      // 8. Limpiar el Carrito
      await tx.carritoItem.deleteMany({
        where: { carritoId: cart.id }
      });

      return {
        orderId: order.id,
        trackingNumber: trackingNum,
        total,
        transactionId: txnId
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Pedido confirmado y pagado con éxito.',
      data: orderResult
    });

  } catch (error: any) {
    // Si es un error controlado en la transacción
    if (error.message && error.message.includes('Stock')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.message && error.message.includes('Dirección')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const getOrderHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }

    const orders = await prisma.orden.findMany({
      where: { usuarioId },
      include: {
        pago: true,
        envio: {
          include: {
            motorizado: true
          }
        },
        items: {
          include: {
            variante: {
              include: {
                producto: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.id;
    const { id } = req.params;

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }

    const order = await prisma.orden.findUnique({
      where: { id },
      include: {
        pago: true,
        envio: {
          include: {
            motorizado: true,
            estados: {
              orderBy: { fecha: 'asc' }
            }
          }
        },
        items: {
          include: {
            variante: {
              include: {
                producto: true,
                atributos: {
                  include: {
                    valor: {
                      include: {
                        atributo: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada.'
      });
    }

    // Verificar propiedad (si no es admin o motorizado, debe ser el propio cliente)
    if (req.user?.rol === 'CLIENTE' && order.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: 'No está autorizado para ver esta orden.'
      });
    }

    return res.json({
      success: true,
      data: order
    });

  } catch (error) {
    next(error);
  }
};
