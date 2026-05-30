import { Request, Response } from 'express';
import prisma from '../config/db';

// 1. Controlador para obtener el catálogo completo de productos con filtros dinámicos
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { gender, category, size, concentration } = req.query;

    // Construcción de condiciones WHERE dinámicas relacionales en Prisma
    const whereClause: any = {};

    if (gender) {
      whereClause.gender = { equals: gender as string, mode: 'insensitive' };
    }

    if (category) {
      whereClause.categoria = { equals: category as string, mode: 'insensitive' };
    }

    // Filtrar mediante las variantes y sus atributos
    if (size || concentration) {
      whereClause.producto_variantes = {
        some: {
          variante_atributos: {
            some: {
              atributo_valores: {
                OR: [
                  size ? { valor: { equals: size as string, mode: 'insensitive' } } : {},
                  concentration ? { valor: { equals: concentration as string, mode: 'insensitive' } } : {}
                ]
              }
            }
          }
        }
      };
    }

    // Consulta relacional optimizada a través de Prisma
    const listProducts = await prisma.productos.findMany({
      where: whereClause,
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
      },
      orderBy: { created_at: 'desc' }
    });

    // Formatear respuesta JSON estructurada a la medida exacta del frontend de Noir Essence
    const formattedProducts = listProducts.map((p) => {
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
          // Extraer atributos relacionales de forma dinámica por nombre para ser resilientes a los IDs de Supabase
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

    res.status(200).json(formattedProducts);
  } catch (error) {
    console.error('[Error en getProducts]:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el catálogo de perfumes.' });
  }
};

// 2. Controlador para obtener el detalle de un perfume específico por ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const p = await prisma.productos.findUnique({
      where: { id },
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
    });

    if (!p) {
      return res.status(404).json({ error: 'El perfume solicitado no existe.' });
    }

    const primeraVariante = p.producto_variantes[0];

    const formattedProduct = {
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

    res.status(200).json(formattedProduct);
  } catch (error) {
    console.error('[Error en getProductById]:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el detalle del perfume.' });
  }
};
