import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';

// Helper para formatear variantes y extraer atributos directamente
const formatProduct = (product: any) => {
  const formattedVariantes = product.variantes.map((v: any) => {
    const sizeAttr = v.atributos.find((a: any) => a.valor.atributo.nombre === 'Tamaño');
    const concAttr = v.atributos.find((a: any) => a.valor.atributo.nombre === 'Concentración');
    const genderAttr = v.atributos.find((a: any) => a.valor.atributo.nombre === 'Género');
    
    return {
      id: v.id,
      sku: v.sku,
      precio: parseFloat(v.precio.toString()),
      stock: v.stock,
      imagenUrl: v.imagenUrl,
      size: sizeAttr ? sizeAttr.valor.valor : null,
      concentration: concAttr ? concAttr.valor.valor : null,
      gender: genderAttr ? genderAttr.valor.valor : null
    };
  });

  return {
    id: product.id,
    nombre: product.nombre,
    marca: product.marca,
    descripcion: product.descripcion,
    esNuevo: product.esNuevo,
    categoria: product.categoria,
    gender: product.gender,
    variantes: formattedVariantes
  };
};

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gender, size, concentration, search } = req.query;
    const conditions: any[] = [];

    // Filtro por género
    if (gender && gender !== 'all') {
      conditions.push({ gender: String(gender) });
    }

    // Búsqueda por nombre o marca
    if (search) {
      conditions.push({
        OR: [
          { nombre: { contains: String(search), mode: 'insensitive' } },
          { marca: { contains: String(search), mode: 'insensitive' } }
        ]
      });
    }

    // Filtro por tamaño (atributo en la variante)
    if (size && size !== 'Todos') {
      conditions.push({
        variantes: {
          some: {
            atributos: {
              some: {
                valor: {
                  valor: String(size),
                  atributo: { nombre: 'Tamaño' }
                }
              }
            }
          }
        }
      });
    }

    // Filtro por concentración (atributo en la variante)
    if (concentration && concentration !== 'Todos') {
      conditions.push({
        variantes: {
          some: {
            atributos: {
              some: {
                valor: {
                  valor: String(concentration),
                  atributo: { nombre: 'Concentración' }
                }
              }
            }
          }
        }
      });
    }

    const products = await prisma.producto.findMany({
      where: conditions.length > 0 ? { AND: conditions } : {},
      include: {
        variantes: {
          include: {
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
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedProducts = products.map(formatProduct);

    return res.json({
      success: true,
      data: formattedProducts
    });

  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.producto.findUnique({
      where: { id },
      include: {
        variantes: {
          include: {
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
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado.'
      });
    }

    return res.json({
      success: true,
      data: formatProduct(product)
    });

  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.id;
    const { id: productoId } = req.params;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado.'
      });
    }

    // Verificar que el producto existe
    const product = await prisma.producto.findUnique({
      where: { id: productoId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado.'
      });
    }

    // Buscar si ya está en favoritos
    const existingFavorite = await prisma.favorito.findUnique({
      where: {
        usuarioId_productoId: {
          usuarioId,
          productoId
        }
      }
    });

    if (existingFavorite) {
      // Si existe, se elimina
      await prisma.favorito.delete({
        where: {
          usuarioId_productoId: {
            usuarioId,
            productoId
          }
        }
      });
      return res.json({
        success: true,
        message: 'Producto removido de favoritos.',
        isFavorite: false
      });
    } else {
      // Si no existe, se añade
      await prisma.favorito.create({
        data: {
          usuarioId,
          productoId
        }
      });
      return res.json({
        success: true,
        message: 'Producto añadido a favoritos.',
        isFavorite: true
      });
    }

  } catch (error) {
    next(error);
  }
};

export const getFavorites = async (
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

    const favorites = await prisma.favorito.findMany({
      where: { usuarioId },
      include: {
        producto: {
          include: {
            variantes: {
              include: {
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

    const formattedFavorites = favorites.map(fav => formatProduct(fav.producto));

    return res.json({
      success: true,
      data: formattedFavorites
    });

  } catch (error) {
    next(error);
  }
};
