import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';

// Helper to get or create a cart
const getOrCreateCart = async (usuarioId: string) => {
  let cart = await prisma.carrito.findUnique({
    where: { usuarioId },
    include: {
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

  if (!cart) {
    cart = await prisma.carrito.create({
      data: { usuarioId },
      include: {
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
  }

  return cart;
};

// Formats cart item output to be clean and simple for frontend
const formatCartItems = (cart: any) => {
  let subtotal = 0;
  
  const items = cart.items.map((item: any) => {
    const v = item.variante;
    const sizeAttr = v.atributos.find((a: any) => a.valor.atributo.nombre === 'Tamaño');
    const concAttr = v.atributos.find((a: any) => a.valor.atributo.nombre === 'Concentración');
    const itemPrice = parseFloat(v.precio.toString());
    const totalItemPrice = itemPrice * item.cantidad;
    
    subtotal += totalItemPrice;

    return {
      id: item.id,
      cantidad: item.cantidad,
      varianteId: v.id,
      sku: v.sku,
      precio: itemPrice,
      precioTotalItem: totalItemPrice,
      producto: {
        id: v.producto.id,
        nombre: v.producto.nombre,
        marca: v.producto.marca,
        imagenUrl: v.imagenUrl || v.producto.imagenUrl
      },
      size: sizeAttr ? sizeAttr.valor.valor : null,
      concentration: concAttr ? concAttr.valor.valor : null
    };
  });

  return {
    cartId: cart.id,
    items,
    subtotal,
    envio: subtotal > 200 ? 0 : 15.0, // Envío gratis a partir de 200 soles
    igv: subtotal * 0.18, // IGV 18% (informátivo)
    total: subtotal + (subtotal > 200 ? 0 : 15.0)
  };
};

export const getCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }

    const cart = await getOrCreateCart(usuarioId);
    return res.json({
      success: true,
      data: formatCartItems(cart)
    });

  } catch (error) {
    next(error);
  }
};

export const addOrUpdateItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.id;
    const { productoVarianteId, cantidad } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }

    if (!productoVarianteId || cantidad === undefined || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Los parámetros productoVarianteId y una cantidad mayor a 0 son requeridos.'
      });
    }

    // Verificar stock de la variante
    const variante = await prisma.productoVariante.findUnique({
      where: { id: productoVarianteId }
    });

    if (!variante) {
      return res.status(404).json({
        success: false,
        error: 'Variante de producto no encontrada.'
      });
    }

    if (variante.stock < cantidad) {
      return res.status(400).json({
        success: false,
        error: `Stock insuficiente. Stock disponible: ${variante.stock}`
      });
    }

    const cart = await getOrCreateCart(usuarioId);

    // Crear o actualizar ítem del carrito
    await prisma.carritoItem.upsert({
      where: {
        carritoId_varianteId: {
          carritoId: cart.id,
          varianteId: productoVarianteId
        }
      },
      update: {
        cantidad: cantidad
      },
      create: {
        carritoId: cart.id,
        varianteId: productoVarianteId,
        cantidad: cantidad
      }
    });

    // Obtener carrito actualizado
    const updatedCart = await getOrCreateCart(usuarioId);

    return res.json({
      success: true,
      message: 'Carrito actualizado con éxito.',
      data: formatCartItems(updatedCart)
    });

  } catch (error) {
    next(error);
  }
};

export const removeItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.id;
    const { itemId } = req.params;

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }

    const cart = await getOrCreateCart(usuarioId);

    // Verificar que el ítem pertenece a este carrito
    const item = await prisma.carritoItem.findUnique({
      where: { id: itemId }
    });

    if (!item || item.carritoId !== cart.id) {
      return res.status(404).json({
        success: false,
        error: 'Ítem no encontrado en su carrito.'
      });
    }

    await prisma.carritoItem.delete({
      where: { id: itemId }
    });

    const updatedCart = await getOrCreateCart(usuarioId);

    return res.json({
      success: true,
      message: 'Ítem removido del carrito.',
      data: formatCartItems(updatedCart)
    });

  } catch (error) {
    next(error);
  }
};

export const clearCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }

    const cart = await getOrCreateCart(usuarioId);

    await prisma.carritoItem.deleteMany({
      where: { carritoId: cart.id }
    });

    const updatedCart = await getOrCreateCart(usuarioId);

    return res.json({
      success: true,
      message: 'Carrito vaciado con éxito.',
      data: formatCartItems(updatedCart)
    });

  } catch (error) {
    next(error);
  }
};
