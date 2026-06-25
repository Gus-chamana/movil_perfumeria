import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Obtener Estadísticas Consolidadas para el Dashboard
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // A. Suma total de ingresos (pagos aprobados)
    const pagosAprobados = await prisma.pagos.findMany({
      where: { estado: 'APROBADO' },
      select: { monto: true }
    });
    const totalSales = pagosAprobados.reduce((sum, p) => sum + Number(p.monto), 0);

    // B. Contador de Pedidos
    const totalOrders = await prisma.ordenes.count();

    // C. Contador de Clientes VIP (Usuarios con rol CLIENTE)
    const totalClients = await prisma.usuarios.count({
      where: { rol: 'CLIENTE' }
    });

    // D. Contador de Productos con Stock Bajo (<= 5 unidades en alguna variante)
    const lowStockProducts = await prisma.producto_variantes.count({
      where: { stock: { lte: 5 } }
    });

    res.status(200).json({
      totalSales,
      totalOrders,
      totalClients,
      lowStockProducts
    });
  } catch (error) {
    console.error('[Error en getDashboardStats]:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener las estadísticas del dashboard.' });
  }
};

// 2. Obtener Lista de todos los Usuarios Registrados
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.usuarios.findMany({
      include: {
        datos_personales: true,
        direcciones: { where: { es_principal: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      rol: u.rol,
      name: u.datos_personales?.nombre || 'N/A',
      lastName: u.datos_personales?.apellido_paterno || '',
      dni: u.datos_personales?.dni || 'N/A',
      address: u.direcciones?.[0]?.direccion || 'Sin dirección',
      district: u.direcciones?.[0]?.distrito || ''
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('[Error en getUsers]:', error);
    res.status(500).json({ error: 'Ocurrió un error al recuperar la lista de usuarios.' });
  }
};

// 3. Cambiar la Categoría/Rol de un Usuario
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // ID del usuario a modificar
    const { newRole } = req.body; // 'ADMIN' | 'CLIENTE' | 'MOTORIZADO'

    if (!newRole || !['ADMIN', 'CLIENTE', 'MOTORIZADO'].includes(newRole)) {
      return res.status(400).json({ error: 'El nuevo rol especificado es inválido.' });
    }

    // Ejecutar atómicamente el cambio de rol
    await prisma.$transaction(async (tx) => {
      // A. Actualizar el rol en la tabla 'usuarios'
      const user = await tx.usuarios.update({
        where: { id },
        data: { rol: newRole }
      });

      // B. Lógica especial de sincronización:
      // Si cambia a MOTORIZADO, asegurar que exista el registro en la tabla 'motorizados'
      if (newRole === 'MOTORIZADO') {
        const motorizadoExiste = await tx.motorizados.findUnique({ where: { id } });
        if (!motorizadoExiste) {
          const userDetails = await tx.datos_personales.findUnique({ where: { usuario_id: id } });
          const nombreMotorizado = userDetails ? `${userDetails.nombre} ${userDetails.apellido_paterno}` : 'Nuevo Motorizado';
          
          await tx.motorizados.create({
            data: {
              id: id,
              nombre: nombreMotorizado,
              telefono: '+51 900 000 000',
              placa_vehiculo: 'PENDIENTE',
              activo: true,
              updated_at: new Date()
            }
          });
        }
      }
    });

    res.status(200).json({ message: `El rol del usuario fue actualizado correctamente a ${newRole}.` });
  } catch (error) {
    console.error('[Error en updateUserRole]:', error);
    res.status(500).json({ error: 'Ocurrió un error al actualizar el rol del usuario.' });
  }
};

// 4. Eliminar un Usuario por completo (Cascada)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // ID del usuario a eliminar

    // Evitar que el administrador se elimine a sí mismo
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'No es posible eliminar tu propia cuenta de administrador.' });
    }

    // Ejecutar de forma transaccional para garantizar la integridad referencial (SOLID)
    await prisma.$transaction(async (tx) => {
      // A. Si el usuario tiene envíos asignados como motorizado, desvincularlos
      await tx.envios.updateMany({
        where: { motorizado_id: id },
        data: { motorizado_id: null }
      });

      // B. Eliminar las órdenes del usuario (su eliminación cascada a 'pagos', 'envio_estados', 'envios', 'detalle_orden')
      await tx.ordenes.deleteMany({
        where: { usuario_id: id }
      });

      // C. Finalmente, eliminar el usuario (su eliminación cascada a 'datos_personales', 'direcciones', 'carrito', 'favoritos', 'motorizados')
      await tx.usuarios.delete({
        where: { id }
      });
    });

    res.status(200).json({ message: 'El usuario y todas sus relaciones fueron eliminados correctamente de Supabase.' });
  } catch (error) {
    console.error('[Error en deleteUser]:', error);
    res.status(500).json({ error: 'Ocurrió un error al eliminar el usuario del sistema.' });
  }
};

// 5. Obtener lista de Motorizados para Administración
export const getMotorizadosList = async (req: AuthRequest, res: Response) => {
  try {
    const motorizados = await prisma.motorizados.findMany({
      include: {
        usuarios: true
      }
    });

    const list = motorizados.map(m => ({
      id: m.id,
      nombre: m.nombre,
      telefono: m.telefono,
      placa: m.placa_vehiculo,
      activo: m.activo,
      email: m.usuarios?.email || 'N/A'
    }));

    res.status(200).json(list);
  } catch (error) {
    console.error('[Error en getMotorizadosList]:', error);
    res.status(500).json({ error: 'Ocurrió un error al recuperar los motorizados.' });
  }
};

// 6. Cambiar el Estado de Actividad de un Motorizado
export const updateMotorizadoStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body; // boolean

    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'El estado "activo" debe ser un booleano.' });
    }

    await prisma.motorizados.update({
      where: { id },
      data: { activo }
    });

    res.status(200).json({ message: 'El estado del motorizado fue actualizado correctamente.' });
  } catch (error) {
    console.error('[Error en updateMotorizadoStatus]:', error);
    res.status(500).json({ error: 'Ocurrió un error al actualizar el estado del motorizado.' });
  }
};

// 7. Modificar el Stock e Inventario de una Variante de Perfume
export const updateProductVariantStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // ID de la variante
    const { stock } = req.body; // number

    if (stock === undefined || typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ error: 'Por favor, proporciona un stock válido (mayor o igual a 0).' });
    }

    const varianteActualizada = await prisma.producto_variantes.update({
      where: { id },
      data: { stock, updated_at: new Date() },
      include: { productos: true }
    });

    res.status(200).json({ 
      message: 'Inventario actualizado con éxito absoluto.',
      sku: varianteActualizada.sku,
      newStock: varianteActualizada.stock
    });
  } catch (error) {
    console.error('[Error en updateProductVariantStock]:', error);
    res.status(500).json({ error: 'Ocurrió un error al actualizar el stock del perfume.' });
  }
};

// 8. Crear un Nuevo Producto con Variantes y Atributos Relacionales
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, brand, description, category, gender, imageUrl, variants } = req.body;

    if (!name || !brand || !description || !category || !gender || !variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar el producto.' });
    }

    const nuevoProducto = await prisma.$transaction(async (tx) => {
      // A. Crear la cabecera del Producto
      const productoId = crypto.randomUUID();
      const product = await tx.productos.create({
        data: {
          id: productoId,
          nombre: name.trim(),
          marca: brand.trim(),
          descripcion: description.trim(),
          es_nuevo: true,
          categoria: category.trim(),
          gender: gender,
          updated_at: new Date()
        }
      });

      // B. Crear cada Variante y asociar sus atributos
      for (const v of variants) {
        const variantId = crypto.randomUUID();
        const skuGenerado = v.sku?.trim() || `${brand.substring(0,2).toUpperCase()}-${name.substring(0,3).toUpperCase()}-${(v.size || 'UNI').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        // Crear la variante de producto
        await tx.producto_variantes.create({
          data: {
            id: variantId,
            producto_id: productoId,
            sku: skuGenerado,
            precio: Number(v.price),
            stock: Number(v.stock),
            imagen_url: imageUrl?.trim() || v.imagen_url?.trim() || null,
            updated_at: new Date()
          }
        });

        // Encontrar o asegurar valor del atributo 'Tamaño'
        if (v.size) {
          let attrTamanio = await tx.atributos.findFirst({
            where: { nombre: { equals: 'Tamaño', mode: 'insensitive' } }
          });
          if (!attrTamanio) {
            attrTamanio = await tx.atributos.create({
              data: { id: crypto.randomUUID(), nombre: 'Tamaño' }
            });
          }

          let valTamanio = await tx.atributo_valores.findFirst({
            where: {
              atributo_id: attrTamanio.id,
              valor: { equals: v.size.trim(), mode: 'insensitive' }
            }
          });
          if (!valTamanio) {
            valTamanio = await tx.atributo_valores.create({
              data: {
                id: crypto.randomUUID(),
                atributo_id: attrTamanio.id,
                valor: v.size.trim()
              }
            });
          }

          // Vincular variante con el valor del atributo Tamaño
          await tx.variante_atributos.create({
            data: {
              producto_variante_id: variantId,
              atributo_valor_id: valTamanio.id
            }
          });
        }

        // Encontrar o asegurar valor del atributo 'Concentración'
        if (v.concentration) {
          let attrConcentracion = await tx.atributos.findFirst({
            where: { nombre: { equals: 'Concentración', mode: 'insensitive' } }
          });
          if (!attrConcentracion) {
            attrConcentracion = await tx.atributos.create({
              data: { id: crypto.randomUUID(), nombre: 'Concentración' }
            });
          }

          let valConcentracion = await tx.atributo_valores.findFirst({
            where: {
              atributo_id: attrConcentracion.id,
              valor: { equals: v.concentration.trim(), mode: 'insensitive' }
            }
          });
          if (!valConcentracion) {
            valConcentracion = await tx.atributo_valores.create({
              data: {
                id: crypto.randomUUID(),
                atributo_id: attrConcentracion.id,
                valor: v.concentration.trim()
              }
            });
          }

          // Vincular variante con el valor del atributo Concentración
          await tx.variante_atributos.create({
            data: {
              producto_variante_id: variantId,
              atributo_valor_id: valConcentracion.id
            }
          });
        }
      }

      return product;
    });

    res.status(201).json({
      message: '¡Producto y sus variantes creados con éxito absoluto en Supabase!',
      product: nuevoProducto
    });
  } catch (error: any) {
    console.error('[Error en createProduct]:', error);
    res.status(500).json({ error: error.message || 'Ocurrió un error al registrar el nuevo producto.' });
  }
};
