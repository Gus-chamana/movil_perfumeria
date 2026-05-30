import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra relacional robusta en Supabase...');

  // 0. Limpiar duplicados de seeds anteriores (productos con UUID auto-generado)
  console.log('🧹 Limpiando registros duplicados de seeds anteriores...');
  const fixedProductIds = [
    'prod-sauvage', 'prod-chanel5', 'prod-aventus', 'prod-bleu', 'prod-black-orchid'
  ];
  // Borrar productos viejos que NO son nuestros IDs fijos (duplicados de TRUNCATE + UUID)
  await prisma.producto.deleteMany({
    where: {
      id: { notIn: fixedProductIds },
      nombre: { in: ['Sauvage', 'N°5', 'Aventus', 'Bleu de Chanel', 'Black Orchid'] }
    }
  });
  // Borrar variante_atributos y variantes existentes de nuestros productos fijos para re-crearlas limpiamente
  const fixedVarianteIds = [
    'var-sauvage-100ml-edp', 'var-sauvage-200ml-edt',
    'var-chanel5-50ml-parfum', 'var-chanel5-100ml-edp',
    'var-creed-100ml-edp',
    'var-bleu-100ml-edp',
    'var-tf-blorq-50ml-edp', 'var-tf-blorq-100ml-edp'
  ];
  await prisma.varianteAtributo.deleteMany({
    where: { varianteId: { in: fixedVarianteIds } }
  });
  await prisma.productoVariante.deleteMany({
    where: { id: { in: fixedVarianteIds } }
  });
  // Also clean old UUID-based variants by SKU (from previous TRUNCATE-based seeds)
  const fixedSkus = [
    'DIOR-SAUV-100-EDP', 'DIOR-SAUV-200-EDT',
    'CHANEL-N5-50-PARF', 'CHANEL-N5-100-EDP',
    'CREED-AV-100-EDP',
    'CHANEL-BLEU-100-EDP',
    'TF-BLORQ-50-EDP', 'TF-BLORQ-100-EDP'
  ];
  // Delete varianteAtributos for old UUID variants matching these SKUs
  const oldVariants = await prisma.productoVariante.findMany({
    where: { sku: { in: fixedSkus } },
    select: { id: true }
  });
  if (oldVariants.length > 0) {
    await prisma.varianteAtributo.deleteMany({
      where: { varianteId: { in: oldVariants.map(v => v.id) } }
    });
    await prisma.productoVariante.deleteMany({
      where: { sku: { in: fixedSkus } }
    });
  }
  console.log('✔️ Duplicados limpiados.');
  console.log('📦 Asegurando Atributos de Variantes...');
  let attrTamanioId = 'attr-tamanio';
  let attrConcentracionId = 'attr-concentracion';

  try {
    const t = await prisma.atributo.upsert({
      where: { nombre: 'Tamaño' },
      update: {},
      create: { id: 'attr-tamanio', nombre: 'Tamaño' }
    });
    attrTamanioId = t.id;
    console.log(`✔️ Atributo 'Tamaño' listo (ID: ${attrTamanioId})`);
  } catch (error) {
    const t = await prisma.atributo.findFirst({ where: { nombre: { equals: 'Tamaño', mode: 'insensitive' } } });
    if (t) attrTamanioId = t.id;
    console.log(`✔️ Reutilizando Atributo 'Tamaño' existente (ID: ${attrTamanioId})`);
  }

  try {
    const c = await prisma.atributo.upsert({
      where: { nombre: 'Concentración' },
      update: {},
      create: { id: 'attr-concentracion', nombre: 'Concentración' }
    });
    attrConcentracionId = c.id;
    console.log(`✔️ Atributo 'Concentración' listo (ID: ${attrConcentracionId})`);
  } catch (error) {
    const c = await prisma.atributo.findFirst({ where: { nombre: { equals: 'Concentración', mode: 'insensitive' } } });
    if (c) attrConcentracionId = c.id;
    console.log(`✔️ Reutilizando Atributo 'Concentración' existente (ID: ${attrConcentracionId})`);
  }

  // 2. Asegurar Atributo Valores
  console.log('📦 Asegurando Valores de Atributos...');
  const valoresDeseados = [
    { id: 'val-50ml', atributoId: attrTamanioId, valor: '50ml' },
    { id: 'val-100ml', atributoId: attrTamanioId, valor: '100ml' },
    { id: 'val-200ml', atributoId: attrTamanioId, valor: '200ml' },
    { id: 'val-edt', atributoId: attrConcentracionId, valor: 'Eau de Toilette' },
    { id: 'val-edp', atributoId: attrConcentracionId, valor: 'Eau de Parfum' },
    { id: 'val-parfum', atributoId: attrConcentracionId, valor: 'Parfum' },
  ];

  const mapaValoresIds: Record<string, string> = {};

  for (const item of valoresDeseados) {
    let valorId = item.id;
    try {
      const v = await prisma.atributoValor.upsert({
        where: { id: item.id },
        update: {},
        create: { id: item.id, atributoId: item.atributoId, valor: item.valor }
      });
      valorId = v.id;
    } catch (e) {
      const v = await prisma.atributoValor.findFirst({
        where: {
          atributoId: item.atributoId,
          valor: { equals: item.valor, mode: 'insensitive' }
        }
      });
      if (v) valorId = v.id;
    }
    mapaValoresIds[item.valor] = valorId;
    console.log(`   🔹 Valor '${item.valor}' asegurado con ID: ${valorId}`);
  }

  // 3. Crear Productos de Lujo (Noir Essence) usando UPSERT para evitar pérdidas destructivas
  console.log('📦 Población y actualización del Catálogo de Perfumes...');

  const perfumes = [
    {
      id: 'prod-sauvage',
      nombre: 'Sauvage',
      marca: 'Dior',
      descripcion: 'Una composición rotundamente fresca, dictada por un nombre que suena como un manifiesto. Radialmente fresca, cruda y noble a la vez.',
      esNuevo: false,
      categoria: 'Amaderados',
      gender: 'men',
      variantes: [
        {
          id: 'var-sauvage-100ml-edp',
          sku: 'DIOR-SAUV-100-EDP',
          precio: 450.00,
          stock: 15,
          imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/sauvage.jpg',
          atributos: ['100ml', 'Eau de Parfum']
        },
        {
          id: 'var-sauvage-200ml-edt',
          sku: 'DIOR-SAUV-200-EDT',
          precio: 620.00,
          stock: 8,
          imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/sauvage.jpg',
          atributos: ['200ml', 'Eau de Toilette']
        }
      ]
    },
    {
      id: 'prod-chanel5',
      nombre: 'N°5',
      marca: 'Chanel',
      descripcion: 'La esencia misma de la feminidad. Un bouquet floral aldehído, sublimado por un frasco icónico con líneas minimalistas.',
      esNuevo: false,
      categoria: 'Florales',
      gender: 'women',
      variantes: [
        {
          id: 'var-chanel5-50ml-parfum',
          sku: 'CHANEL-N5-50-PARF',
          precio: 380.00,
          stock: 10,
          imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/chanel5.jpg',
          atributos: ['50ml', 'Parfum']
        },
        {
          id: 'var-chanel5-100ml-edp',
          sku: 'CHANEL-N5-100-EDP',
          precio: 550.00,
          stock: 12,
          imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/chanel5.jpg',
          atributos: ['100ml', 'Eau de Parfum']
        }
      ]
    },
    {
      id: 'prod-aventus',
      nombre: 'Aventus',
      marca: 'Creed',
      descripcion: 'Celebrando la fuerza, el poder y el éxito, esta fragancia gourmet afrutada y rica es perfecta para el hombre contemporáneo audaz.',
      esNuevo: true,
      categoria: 'Cítricos',
      gender: 'men',
      variantes: [
        {
          id: 'var-creed-100ml-edp',
          sku: 'CREED-AV-100-EDP',
          precio: 950.00,
          stock: 6,
          imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/aventus.jpg',
          atributos: ['100ml', 'Eau de Parfum']
        }
      ]
    },
    {
      id: 'prod-bleu',
      nombre: 'Bleu de Chanel',
      marca: 'Chanel',
      descripcion: 'El elogio de la libertad masculina en un acorde aromático amaderado con una estela cautivadora. Un aroma atemporal y sensual.',
      esNuevo: true,
      categoria: 'Amaderados',
      gender: 'men',
      variantes: [
        {
          id: 'var-bleu-100ml-edp',
          sku: 'CHANEL-BLEU-100-EDP',
          precio: 490.00,
          stock: 20,
          imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/bleu.jpg',
          atributos: ['100ml', 'Eau de Parfum']
        }
      ]
    },
    {
      id: 'prod-black-orchid',
      nombre: 'Black Orchid',
      marca: 'Tom Ford',
      descripcion: 'Una fragancia lujosa y sensual de acordes oscuros e intrigantes, combinada con una rica poción de orquídeas negras y especias.',
      esNuevo: false,
      categoria: 'Orientales',
      gender: 'unisex',
      variantes: [
        {
          id: 'var-tf-blorq-50ml-edp',
          sku: 'TF-BLORQ-50-EDP',
          precio: 420.00,
          stock: 4,
          imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/black_orchid.jpg',
          atributos: ['50ml', 'Eau de Parfum']
        },
        {
          id: 'var-tf-blorq-100ml-edp',
          sku: 'TF-BLORQ-100-EDP',
          precio: 610.00,
          stock: 7,
          imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/black_orchid.jpg',
          atributos: ['100ml', 'Eau de Parfum']
        }
      ]
    }
  ];

  for (const item of perfumes) {
    // Upsert del Producto
    await prisma.producto.upsert({
      where: { id: item.id },
      update: {
        nombre: item.nombre,
        marca: item.marca,
        descripcion: item.descripcion,
        categoria: item.categoria,
        gender: item.gender
      },
      create: {
        id: item.id,
        nombre: item.nombre,
        marca: item.marca,
        descripcion: item.descripcion,
        esNuevo: item.esNuevo,
        categoria: item.categoria,
        gender: item.gender
      }
    });

    console.log(`   ✔️ Producto base listo: ${item.nombre}`);

    // Crear sus variantes
    for (const v of item.variantes) {
      try {
        const varExistente = await prisma.productoVariante.findUnique({ where: { sku: v.sku } });
        
        if (varExistente) {
          await prisma.productoVariante.update({
            where: { sku: v.sku },
            data: {
              precio: v.precio,
              stock: v.stock,
              imagenUrl: v.imagenUrl
            }
          });
          console.log(`      🔹 Variante SKU ${v.sku} actualizada.`);
        } else {
          // Crear la variante
          await prisma.productoVariante.create({
            data: {
              id: v.id,
              productoId: item.id,
              sku: v.sku,
              precio: v.precio,
              stock: v.stock,
              imagenUrl: v.imagenUrl
            }
          });
          console.log(`      🔹 Variante SKU ${v.sku} creada.`);

          // Asociar atributos a la variante
          for (const attrNombre of v.atributos) {
            const attrValId = mapaValoresIds[attrNombre];
            if (attrValId) {
              await prisma.varianteAtributo.create({
                data: {
                  varianteId: v.id,
                  valorId: attrValId
                }
              });
            }
          }
        }
      } catch (errVariante) {
        console.warn(`      ⚠️  Aviso en variante SKU ${v.sku}:`, errVariante instanceof Error ? errVariante.message : errVariante);
      }
    }
  }

  // 4. Crear Usuarios de Prueba (Cliente, Administrador, Motorizado)
  console.log('📦 Población de usuarios de prueba...');
  const saltRounds = 10;
  const hashPassword = (pw: string) => bcrypt.hashSync(pw, saltRounds);

  // Admin
  try {
    await prisma.usuario.upsert({
      where: { email: 'admin@noinessence.com' },
      update: {},
      create: {
        email: 'admin@noinessence.com',
        password: hashPassword('admin123'),
        rol: Role.ADMIN,
        datosPersonales: {
          create: {
            nombre: 'Administrador',
            apellidoPaterno: 'Noir',
            apellidoMaterno: 'Essence',
            dni: '00000000'
          }
        }
      }
    });
    console.log('✔️ Cuenta de Admin asegurada.');
  } catch (err) {
    console.log('🔹 Cuenta de Admin ya existía.');
  }

  // Motorizado
  try {
    await prisma.usuario.upsert({
      where: { email: 'motorizado@noinessence.com' },
      update: {},
      create: {
        email: 'motorizado@noinessence.com',
        password: hashPassword('motorizado123'),
        rol: Role.MOTORIZADO,
        motorizado: {
          create: {
            nombre: 'Juan Carlos Pérez',
            telefono: '987654321',
            placaVehiculo: 'MX-4842',
            activo: true
          }
        }
      }
    });
    console.log('✔️ Cuenta de Motorizado asegurada.');
  } catch (err) {
    console.log('🔹 Cuenta de Motorizado ya existía.');
  }

  // Cliente de prueba
  try {
    await prisma.usuario.upsert({
      where: { email: 'cliente@noinessence.com' },
      update: {},
      create: {
        email: 'cliente@noinessence.com',
        password: hashPassword('cliente123'),
        rol: Role.CLIENTE,
        datosPersonales: {
          create: {
            nombre: 'Carlos',
            apellidoPaterno: 'Gómez',
            apellidoMaterno: 'Silva',
            dni: '73948502'
          }
        },
        direcciones: {
          create: [
            {
              direccion: 'Av. Larco 456, Dpto 402',
              departamento: 'Lima',
              provincia: 'Lima',
              distrito: 'Miraflores',
              referencia: 'Frente al Parque Salazar',
              esPrincipal: true
            },
            {
              direccion: 'Calle Las Orquídeas 789',
              departamento: 'Lima',
              provincia: 'Lima',
              distrito: 'San Isidro',
              referencia: 'A dos cuadras de Rivera Navarrete',
              esPrincipal: false
            }
          ]
        }
      }
    });
    console.log('✔️ Cuenta de Cliente asegurada.');
  } catch (err) {
    console.log('🔹 Cuenta de Cliente ya existía.');
  }

  console.log('🌱 Siembra y actualización de base de datos relacional completada con éxito absoluto.');
}

main()
  .catch((e) => {
    console.error('❌ Error fatal al realizar la siembra relacional:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
