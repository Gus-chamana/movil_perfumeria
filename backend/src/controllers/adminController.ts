import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
        direcciones: { where: { es_principal: true } },
        motorizados: true
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedUsers = [];

    for (const u of users) {
      let name = u.datos_personales?.nombre || 'N/A';
      let lastName = u.datos_personales?.apellido_paterno || '';
      let dni = u.datos_personales?.dni || 'N/A';

      // Auto-curativo: si es motorizado y no tiene datos personales pero tiene nombre en motorizados
      if (u.rol === 'MOTORIZADO' && u.motorizados) {
        if (!u.datos_personales || !u.datos_personales.nombre || u.datos_personales.nombre === 'N/A') {
          const fullName = u.motorizados.nombre.trim();
          const parts = fullName.split(' ');
          let parsedName = fullName;
          let parsedLastName = '';
          if (parts.length > 1) {
            parsedLastName = parts.pop() || '';
            parsedName = parts.join(' ');
          }
          name = parsedName;
          lastName = parsedLastName;

          try {
            await prisma.datos_personales.upsert({
              where: { usuario_id: u.id },
              create: {
                id: crypto.randomUUID(),
                usuario_id: u.id,
                nombre: parsedName,
                apellido_paterno: parsedLastName,
                dni: '70000000',
                updated_at: new Date()
              },
              update: {
                nombre: parsedName,
                apellido_paterno: parsedLastName,
                updated_at: new Date()
              }
            });
            console.log(`[Auto-curación] Datos personales creados para motorizado: ${u.email}`);
          } catch (dbErr) {
            console.error(`[Error Auto-curación para ${u.email}]:`, dbErr);
          }
        }
      }

      formattedUsers.push({
        id: u.id,
        email: u.email,
        rol: u.rol,
        name,
        lastName,
        dni,
        address: u.direcciones?.[0]?.direccion || 'Sin dirección',
        district: u.direcciones?.[0]?.distrito || ''
      });
    }

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
      if (newRole === 'MOTORIZADO') {
        let userDetails = await tx.datos_personales.findUnique({ where: { usuario_id: id } });
        if (!userDetails) {
          userDetails = await tx.datos_personales.create({
            data: {
              id: crypto.randomUUID(),
              usuario_id: id,
              nombre: 'Nuevo',
              apellido_paterno: 'Motorizado',
              dni: '70000000',
              updated_at: new Date()
            }
          });
        }

        const motorizadoExiste = await tx.motorizados.findUnique({ where: { id } });
        if (!motorizadoExiste) {
          await tx.motorizados.create({
            data: {
              id: id,
              nombre: `${userDetails.nombre} ${userDetails.apellido_paterno}`.trim(),
              telefono: '+51 900 000 000',
              placa_vehiculo: 'PENDIENTE',
              activo: true,
              updated_at: new Date()
            }
          });
        } else {
          await tx.motorizados.update({
            where: { id },
            data: {
              nombre: `${userDetails.nombre} ${userDetails.apellido_paterno}`.trim(),
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
    // 1. Obtener y limpiar de forma automática motorizados que ya no tienen el rol de MOTORIZADO (Auto-curativo)
    const invalidMotorizados = await prisma.motorizados.findMany({
      where: {
        usuarios: {
          rol: { not: 'MOTORIZADO' }
        }
      }
    });

    if (invalidMotorizados.length > 0) {
      console.log(`🧹 Limpiando ${invalidMotorizados.length} registros huérfanos de la tabla 'motorizados'...`);
      for (const m of invalidMotorizados) {
        try {
          await prisma.$transaction(async (tx) => {
            await tx.envios.updateMany({
              where: { motorizado_id: m.id },
              data: { motorizado_id: null }
            });
            await tx.motorizados.delete({
              where: { id: m.id }
            });
          });
        } catch (cleanupErr) {
          console.error(`[Error al limpiar motorizado huérfano ${m.id}]:`, cleanupErr);
        }
      }
    }

    // 2. Obtener lista final filtrada por usuarios activos con rol MOTORIZADO
    const motorizados = await prisma.motorizados.findMany({
      where: {
        usuarios: {
          rol: 'MOTORIZADO'
        }
      },
      include: {
        usuarios: {
          include: {
            datos_personales: true
          }
        }
      }
    });

    const list = motorizados.map(m => {
      const userDetails = m.usuarios?.datos_personales;
      const nombre = userDetails ? `${userDetails.nombre} ${userDetails.apellido_paterno}`.trim() : m.nombre;
      return {
        id: m.id,
        nombre: nombre || 'Nuevo Motorizado',
        telefono: m.telefono,
        placa: m.placa_vehiculo,
        activo: m.activo,
        email: m.usuarios?.email || 'N/A'
      };
    });

    res.status(200).json(list);
  } catch (error) {
    console.error('[Error en getMotorizadosList]:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener la lista de motorizados.' });
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

// 9. Registrar un Nuevo Usuario desde el panel de administración
export const createAdminUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, lastName, dni, address, district, role } = req.body;

    if (!email || !password || !name || !lastName || !dni || !address || !district || !role) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Verificar si el correo ya existe
    const userExists = await prisma.usuarios.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
    }

    // Encriptar contraseña
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const usuarioId = crypto.randomUUID();
    const datosPersonalesId = crypto.randomUUID();
    const direccionId = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      // A. Crear registro en 'usuarios'
      await tx.usuarios.create({
        data: {
          id: usuarioId,
          email,
          password: hashedPassword,
          rol: role,
          updated_at: new Date()
        }
      });

      // B. Crear registro en 'datos_personales'
      await tx.datos_personales.create({
        data: {
          id: datosPersonalesId,
          usuario_id: usuarioId,
          nombre: name.trim(),
          apellido_paterno: lastName.trim(),
          dni: dni.trim(),
          updated_at: new Date()
        }
      });

      // C. Crear registro en 'direcciones'
      await tx.direcciones.create({
        data: {
          id: direccionId,
          usuario_id: usuarioId,
          direccion: address.trim(),
          departamento: 'Lima',
          provincia: 'Lima',
          distrito: district.trim(),
          referencia: 'Registrado por Administrador',
          es_principal: true,
          updated_at: new Date()
        }
      });

      // D. Si es motorizado, crear registro en 'motorizados'
      if (role === 'MOTORIZADO') {
        await tx.motorizados.create({
          data: {
            id: usuarioId,
            nombre: `${name.trim()} ${lastName.trim()}`,
            telefono: '+51 900 000 000',
            placa_vehiculo: 'PENDIENTE',
            activo: true,
            updated_at: new Date()
          }
        });
      }
    });

    res.status(201).json({ message: 'Usuario registrado con éxito absoluto.' });
  } catch (error: any) {
    console.error('[Error en createAdminUser]:', error);
    res.status(500).json({ error: error.message || 'Ocurrió un error al registrar el nuevo usuario.' });
  }
};

// 10. Modificar datos completos de un Usuario desde el panel
export const updateAdminUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, name, lastName, dni, address, district, role } = req.body;

    if (!email || !name || !lastName || !dni || !address || !district || !role) {
      return res.status(400).json({ error: 'Todos los campos excepto la contraseña son obligatorios.' });
    }

    await prisma.$transaction(async (tx) => {
      const currentUser = await tx.usuarios.findUnique({ where: { id } });
      if (!currentUser) {
        throw new Error('El usuario solicitado no existe.');
      }

      const userUpdateData: any = {
        email,
        rol: role,
        updated_at: new Date()
      };

      if (password && password.trim() !== '') {
        const salt = bcrypt.genSaltSync(10);
        userUpdateData.password = bcrypt.hashSync(password, salt);
      }

      // A. Actualizar usuarios
      await tx.usuarios.update({
        where: { id },
        data: userUpdateData
      });

      // B. Actualizar o crear datos personales
      await tx.datos_personales.upsert({
        where: { usuario_id: id },
        create: {
          id: crypto.randomUUID(),
          usuario_id: id,
          nombre: name.trim(),
          apellido_paterno: lastName.trim(),
          dni: dni.trim(),
          updated_at: new Date()
        },
        update: {
          nombre: name.trim(),
          apellido_paterno: lastName.trim(),
          dni: dni.trim(),
          updated_at: new Date()
        }
      });

      // C. Actualizar o crear dirección principal
      const principalDir = await tx.direcciones.findFirst({
        where: { usuario_id: id, es_principal: true }
      });

      if (principalDir) {
        await tx.direcciones.update({
          where: { id: principalDir.id },
          data: {
            direccion: address.trim(),
            distrito: district.trim(),
            updated_at: new Date()
          }
        });
      } else {
        await tx.direcciones.create({
          data: {
            id: crypto.randomUUID(),
            usuario_id: id,
            direccion: address.trim(),
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: district.trim(),
            referencia: 'Dirección principal registrada por administrador',
            es_principal: true,
            updated_at: new Date()
          }
        });
      }

      // D. Sincronizar tabla motorizados:
      if (role === 'MOTORIZADO') {
        const motorizadoExiste = await tx.motorizados.findUnique({ where: { id } });
        if (!motorizadoExiste) {
          await tx.motorizados.create({
            data: {
              id: id,
              nombre: `${name.trim()} ${lastName.trim()}`,
              telefono: '+51 900 000 000',
              placa_vehiculo: 'PENDIENTE',
              activo: true,
              updated_at: new Date()
            }
          });
        } else {
          // Actualizar nombre si cambió
          await tx.motorizados.update({
            where: { id },
            data: {
              nombre: `${name.trim()} ${lastName.trim()}`,
              updated_at: new Date()
            }
          });
        }
      } else {
        // Si deja de ser MOTORIZADO, eliminarlo de la tabla de motorizados (desvinculando envíos primero)
        const motorizadoExiste = await tx.motorizados.findUnique({ where: { id } });
        if (motorizadoExiste) {
          await tx.envios.updateMany({
            where: { motorizado_id: id },
            data: { motorizado_id: null }
          });
          await tx.motorizados.delete({
            where: { id }
          });
        }
      }
    });

    res.status(200).json({ message: 'Los datos del usuario fueron actualizados correctamente.' });
  } catch (error: any) {
    console.error('[Error en updateAdminUser]:', error);
    res.status(500).json({ error: error.message || 'Ocurrió un error al actualizar los datos del usuario.' });
  }
};

// 11. Cambiar los detalles (Placa y Teléfono) de un Motorizado
export const updateMotorizadoDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { telefono, placa } = req.body;

    if (!telefono || !placa) {
      return res.status(400).json({ error: 'El teléfono y la placa del vehículo son obligatorios.' });
    }

    await prisma.motorizados.update({
      where: { id },
      data: {
        telefono: telefono.trim(),
        placa_vehiculo: placa.trim().toUpperCase(),
        updated_at: new Date()
      }
    });

    res.status(200).json({ message: 'Los datos del motorizado fueron actualizados correctamente.' });
  } catch (error) {
    console.error('[Error en updateMotorizadoDetails]:', error);
    res.status(500).json({ error: 'Ocurrió un error al actualizar los datos del motorizado.' });
  }
};

// 12. Modificar datos de un Producto y sus variantes
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, brand, description, category, gender, imageUrl, variants } = req.body;

    if (!name || !brand || !description || !category || !gender || !variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar el producto.' });
    }

    await prisma.$transaction(async (tx) => {
      // A. Actualizar cabecera del producto
      await tx.productos.update({
        where: { id },
        data: {
          nombre: name.trim(),
          marca: brand.trim(),
          descripcion: description.trim(),
          categoria: category.trim(),
          gender: gender,
          updated_at: new Date()
        }
      });

      // B. Obtener todas las variantes existentes en la base de datos para este producto
      const dbVariants = await tx.producto_variantes.findMany({
        where: { producto_id: id }
      });

      const updatedVariantIds = variants.filter(v => v.id).map(v => v.id);

      // C. Identificar variantes a eliminar (las que están en DB pero no en la petición)
      const variantsToDelete = dbVariants.filter(dv => !updatedVariantIds.includes(dv.id));

      for (const dv of variantsToDelete) {
        try {
          // Intentar borrar las vinculaciones de atributos
          await tx.variante_atributos.deleteMany({
            where: { producto_variante_id: dv.id }
          });
          // Intentar borrar los items de carritos
          await tx.carrito_items.deleteMany({
            where: { producto_variante_id: dv.id }
          });
          // Intentar borrar la variante
          await tx.producto_variantes.delete({
            where: { id: dv.id }
          });
        } catch (delErr) {
          console.warn(`[No se pudo borrar variante ${dv.id}]:`, delErr);
          throw new Error(`La variante con SKU ${dv.sku} no se puede eliminar porque está asociada a órdenes históricas. Sugerencia: Establece su stock en 0.`);
        }
      }

      // D. Buscar o asegurar los atributos principales una sola vez al inicio para optimizar la latencia
      let attrTamanio = await tx.atributos.findFirst({
        where: { nombre: { equals: 'Tamaño', mode: 'insensitive' } }
      });
      if (!attrTamanio) {
        attrTamanio = await tx.atributos.create({
          data: { id: crypto.randomUUID(), nombre: 'Tamaño' }
        });
      }

      let attrConcentracion = await tx.atributos.findFirst({
        where: { nombre: { equals: 'Concentración', mode: 'insensitive' } }
      });
      if (!attrConcentracion) {
        attrConcentracion = await tx.atributos.create({
          data: { id: crypto.randomUUID(), nombre: 'Concentración' }
        });
      }

      // E. Crear o actualizar variantes
      for (const v of variants) {
        let variantId = v.id;
        const skuGenerado = v.sku?.trim() || `${brand.substring(0,2).toUpperCase()}-${name.substring(0,3).toUpperCase()}-${(v.size || 'UNI').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        if (variantId) {
          // Actualizar variante existente
          await tx.producto_variantes.update({
            where: { id: variantId },
            data: {
              sku: skuGenerado,
              precio: Number(v.price),
              stock: Number(v.stock),
              imagen_url: imageUrl?.trim() || v.imageUrl?.trim() || null,
              updated_at: new Date()
            }
          });

          // Limpiar vinculaciones anteriores de atributos
          await tx.variante_atributos.deleteMany({
            where: { producto_variante_id: variantId }
          });
        } else {
          // Crear nueva variante
          variantId = crypto.randomUUID();
          await tx.producto_variantes.create({
            data: {
              id: variantId,
              producto_id: id,
              sku: skuGenerado,
              precio: Number(v.price),
              stock: Number(v.stock),
              imagen_url: imageUrl?.trim() || v.imageUrl?.trim() || null,
              updated_at: new Date()
            }
          });
        }

        // Vincular atributos (Tamaño y Concentración)
        if (v.size) {
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

          await tx.variante_atributos.create({
            data: {
              producto_variante_id: variantId,
              atributo_valor_id: valTamanio.id
            }
          });
        }

        if (v.concentration) {
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

          await tx.variante_atributos.create({
            data: {
              producto_variante_id: variantId,
              atributo_valor_id: valConcentracion.id
            }
          });
        }
      }
    }, {
      maxWait: 15000,
      timeout: 30000
    });


    res.status(200).json({ message: 'El producto y sus variantes fueron actualizados con éxito absoluto.' });
  } catch (error: any) {
    console.error('[Error en updateProduct]:', error);
    res.status(500).json({ error: error.message || 'Ocurrió un error al actualizar el producto.' });
  }
};



