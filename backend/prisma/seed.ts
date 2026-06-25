import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra relacional robusta en Supabase...');

  // 1. Asegurar Atributos
  console.log('📦 Asegurando Atributos de Variantes...');
  let attrTamanioId = 'attr-tamanio';
  let attrConcentracionId = 'attr-concentracion';

  try {
    const t = await prisma.atributos.upsert({
      where: { nombre: 'Tamaño' },
      update: {},
      create: { id: 'attr-tamanio', nombre: 'Tamaño' }
    });
    attrTamanioId = t.id;
    console.log(`✔️ Atributo 'Tamaño' listo (ID: ${attrTamanioId})`);
  } catch (error) {
    // Si ya existe con otro ID, lo recuperamos
    const t = await prisma.atributos.findFirst({ where: { nombre: { equals: 'Tamaño', mode: 'insensitive' } } });
    if (t) attrTamanioId = t.id;
    console.log(`✔️ Reutilizando Atributo 'Tamaño' existente (ID: ${attrTamanioId})`);
  }

  try {
    const c = await prisma.atributos.upsert({
      where: { nombre: 'Concentración' },
      update: {},
      create: { id: 'attr-concentracion', nombre: 'Concentración' }
    });
    attrConcentracionId = c.id;
    console.log(`✔️ Atributo 'Concentración' listo (ID: ${attrConcentracionId})`);
  } catch (error) {
    const c = await prisma.atributos.findFirst({ where: { nombre: { equals: 'Concentración', mode: 'insensitive' } } });
    if (c) attrConcentracionId = c.id;
    console.log(`✔️ Reutilizando Atributo 'Concentración' existente (ID: ${attrConcentracionId})`);
  }

  // 2. Asegurar Atributo Valores
  console.log('📦 Asegurando Valores de Atributos...');
  const valoresDeseados = [
    { id: 'val-50ml', atributo_id: attrTamanioId, valor: '50ml' },
    { id: 'val-100ml', atributo_id: attrTamanioId, valor: '100ml' },
    { id: 'val-200ml', atributo_id: attrTamanioId, valor: '200ml' },
    { id: 'val-edt', atributo_id: attrConcentracionId, valor: 'Eau de Toilette' },
    { id: 'val-edp', atributo_id: attrConcentracionId, valor: 'Eau de Parfum' },
    { id: 'val-parfum', atributo_id: attrConcentracionId, valor: 'Parfum' },
  ];

  const mapaValoresIds: Record<string, string> = {};

  for (const item of valoresDeseados) {
    let valorId = item.id;
    try {
      const v = await prisma.atributo_valores.upsert({
        where: { id: item.id },
        update: {},
        create: { id: item.id, atributo_id: item.atributo_id, valor: item.valor }
      });
      valorId = v.id;
    } catch (e) {
      // Si falla por restricción única de combinación, buscamos el valor existente
      const v = await prisma.atributo_valores.findFirst({
        where: {
          atributo_id: item.atributo_id,
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
      id: 'prod-oud-luxury',
      nombre: 'All Black',
      marca: 'Noir Essence',
      descripcion: 'Una fragancia mística basada en madera de oud pura, ámbar gris y toques de cuero de lujo.',
      es_nuevo: true,
      categoria: 'Orientales',
      gender: 'unisex',
      variantes: [
        {
          id: 'var-oud-100ml-parfum',
          sku: 'NE-OUD-100-PARFUM',
          precio: 320.00,
          stock: 25,
          imagen_url: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/Productos/Allblackcyzone.webp',
          atributos: ['100ml', 'Parfum']
        }
      ]
    },
    {
      id: 'prod-rose-imperiale',
      nombre: 'Rose Imperiale',
      marca: 'Noir Essence',
      descripcion: 'Rosas de Damasco combinadas con vainilla de Madagascar y almizcle blanco.',
      es_nuevo: false,
      categoria: 'Florales',
      gender: 'women',
      variantes: [
        {
          id: 'var-rose-100ml-edp',
          sku: 'NE-ROSE-100-EDP',
          precio: 290.00,
          stock: 15,
          imagen_url: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/rose-imperiale.png',
          atributos: ['100ml', 'Eau de Parfum']
        }
      ]
    },
    {
      id: 'prod-blue-amber',
      nombre: 'Blue Amber',
      marca: 'Noir Essence',
      descripcion: 'Ámbar azul del mar Índico matizado con cedro del Líbano y sándalo indio.',
      es_nuevo: true,
      categoria: 'Amaderados',
      gender: 'men',
      variantes: [
        {
          id: 'var-blue-100ml-parfum',
          sku: 'NE-BLUE-100-PARFUM',
          precio: 310.00,
          stock: 20,
          imagen_url: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/blue-amber.png',
          atributos: ['100ml', 'Parfum']
        }
      ]
    }
  ];

  for (const item of perfumes) {
    // Upsert del Producto
    await prisma.productos.upsert({
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
        es_nuevo: item.es_nuevo,
        categoria: item.categoria,
        gender: item.gender,
        updated_at: new Date()
      }
    });

    console.log(`   ✔️ Producto base listo: ${item.nombre}`);

    // Crear sus variantes
    for (const v of item.variantes) {
      try {
        // Para evitar duplicados en variantes, verificamos por SKU
        const varExistente = await prisma.producto_variantes.findUnique({ where: { sku: v.sku } });
        
        if (varExistente) {
          await prisma.producto_variantes.update({
            where: { sku: v.sku },
            data: {
              precio: v.precio,
              stock: v.stock,
              imagen_url: v.imagen_url,
              updated_at: new Date()
            }
          });
          console.log(`      🔹 Variante SKU ${v.sku} actualizada.`);
        } else {
          // Crear la variante
          await prisma.producto_variantes.create({
            data: {
              id: v.id,
              producto_id: item.id,
              sku: v.sku,
              precio: v.precio,
              stock: v.stock,
              imagen_url: v.imagen_url,
              updated_at: new Date()
            }
          });
          console.log(`      🔹 Variante SKU ${v.sku} creada.`);

          // Asociar atributos a la variante
          for (const attrNombre of v.atributos) {
            const attrValId = mapaValoresIds[attrNombre];
            if (attrValId) {
              await prisma.variante_atributos.create({
                data: {
                  producto_variante_id: v.id,
                  atributo_valor_id: attrValId
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
