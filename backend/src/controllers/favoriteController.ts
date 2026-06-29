import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Obtener todos los productos favoritos del usuario
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    const listFavorites = await prisma.favoritos.findMany({
      where: { usuario_id: usuarioId },
      include: {
        productos: {
          include: {
            producto_variantes: {
              include: {
                variante_atributos: {
                  include: {
                    atributo_valores: {
                      include: {
                        atributos: true
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

    // Formatear la lista de productos al estándar que el frontend espera
    const formatted = listFavorites.map((f) => {
      const p = f.productos;
      const primeraVariante = p.producto_variantes[0];
      return {
        id: p.id,
        name: p.nombre,
        brand: p.marca,
        description: p.descripcion,
        isNew: p.es_nuevo,
        category: p.categoria,
        gender: p.gender,
        price: primeraVariante ? Number(primeraVariante.precio) : 0,
        imageUrl: primeraVariante ? primeraVariante.imagen_url : null,
        stock: primeraVariante ? primeraVariante.stock : 0,
        variants: p.producto_variantes.map((v) => {
          const tamanioAttr = v.variante_atributos.find(va => 
            va.atributo_valores.atributos.nombre.localeCompare('Tamaño', undefined, { sensitivity: 'base' }) === 0
          );
          const concentracionAttr = v.variante_atributos.find(va => 
            va.atributo_valores.atributos.nombre.localeCompare('Concentración', undefined, { sensitivity: 'base' }) === 0
          );
          return {
            id: v.id,
            sku: v.sku,
            price: Number(v.precio),
            stock: v.stock,
            imageUrl: v.imagen_url,
            size: tamanioAttr ? tamanioAttr.atributo_valores.valor : null,
            concentration: concentracionAttr ? concentracionAttr.atributo_valores.valor : null
          };
        })
      };
    });

    res.status(200).json(formatted);
  } catch (error: any) {
    console.error('[Error en getFavorites]:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener la lista de favoritos.' });
  }
};

// 2. Agregar un producto a favoritos
export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    const { productId } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }
    if (!productId) {
      return res.status(400).json({ error: 'El ID del producto es obligatorio.' });
    }

    await prisma.favoritos.upsert({
      where: {
        usuario_id_producto_id: {
          usuario_id: usuarioId,
          producto_id: productId
        }
      },
      create: {
        usuario_id: usuarioId,
        producto_id: productId
      },
      update: {}
    });

    res.status(201).json({ message: 'Producto agregado a favoritos correctamente.' });
  } catch (error: any) {
    console.error('[Error en addFavorite]:', error);
    res.status(500).json({ error: 'Ocurrió un error al guardar favorito.' });
  }
};

// 3. Eliminar un producto de favoritos
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    const { productId } = req.params;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }
    if (!productId) {
      return res.status(400).json({ error: 'El ID del producto es obligatorio.' });
    }

    await prisma.favoritos.delete({
      where: {
        usuario_id_producto_id: {
          usuario_id: usuarioId,
          producto_id: productId
        }
      }
    });

    res.status(200).json({ message: 'Producto eliminado de favoritos correctamente.' });
  } catch (error: any) {
    console.error('[Error en removeFavorite]:', error);
    res.status(500).json({ error: 'Ocurrió un error al eliminar favorito.' });
  }
};
