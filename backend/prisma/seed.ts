import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando proceso de inicialización (seed)...');

  // Limpiar base de datos
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "usuarios", "datos_personales", "direcciones", "productos", "producto_variantes", "atributos", "atributo_valores", "variante_atributos", "carrito", "carrito_items", "favoritos", "ordenes", "detalle_orden", "pagos", "envios", "envio_estados", "motorizados" CASCADE;`);
  console.log('Base de datos limpiada.');

  // 1. Crear Atributos y Valores
  console.log('Creando atributos (Tamaño, Concentración, Género)...');
  const attrTamaño = await prisma.atributo.create({
    data: { nombre: 'Tamaño' }
  });

  const val50ml = await prisma.atributoValor.create({
    data: { atributoId: attrTamaño.id, valor: '50ml' }
  });
  const val100ml = await prisma.atributoValor.create({
    data: { atributoId: attrTamaño.id, valor: '100ml' }
  });
  const val200ml = await prisma.atributoValor.create({
    data: { atributoId: attrTamaño.id, valor: '200ml' }
  });

  const attrConcentración = await prisma.atributo.create({
    data: { nombre: 'Concentración' }
  });

  const valEDP = await prisma.atributoValor.create({
    data: { atributoId: attrConcentración.id, valor: 'Eau de Parfum' }
  });
  const valEDT = await prisma.atributoValor.create({
    data: { atributoId: attrConcentración.id, valor: 'Eau de Toilette' }
  });
  const valParfum = await prisma.atributoValor.create({
    data: { atributoId: attrConcentración.id, valor: 'Parfum' }
  });

  const attrGénero = await prisma.atributo.create({
    data: { nombre: 'Género' }
  });

  const valHombre = await prisma.atributoValor.create({
    data: { atributoId: attrGénero.id, valor: 'Hombre' }
  });
  const valMujer = await prisma.atributoValor.create({
    data: { atributoId: attrGénero.id, valor: 'Mujer' }
  });
  const valUnisex = await prisma.atributoValor.create({
    data: { atributoId: attrGénero.id, valor: 'Unisex' }
  });

  // 2. Crear Productos y sus Variantes
  console.log('Creando catálogo de fragancias de lujo...');
  
  // Dior Sauvage
  const sauvage = await prisma.producto.create({
    data: {
      nombre: 'Sauvage',
      marca: 'Dior',
      descripcion: 'Una composición rotundamente fresca, dictada por un nombre que suena como un manifiesto. Radialmente fresca, cruda y noble a la vez.',
      esNuevo: false,
      categoria: 'Perfumes',
      gender: 'men'
    }
  });

  const sauvage100 = await prisma.productoVariante.create({
    data: {
      productoId: sauvage.id,
      sku: 'DIOR-SAUV-100-EDP',
      precio: 450.00,
      stock: 15,
      imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/sauvage.jpg'
    }
  });
  await prisma.varianteAtributo.createMany({
    data: [
      { varianteId: sauvage100.id, valorId: val100ml.id },
      { varianteId: sauvage100.id, valorId: valEDP.id },
      { varianteId: sauvage100.id, valorId: valHombre.id }
    ]
  });

  const sauvage200 = await prisma.productoVariante.create({
    data: {
      productoId: sauvage.id,
      sku: 'DIOR-SAUV-200-EDT',
      precio: 620.00,
      stock: 8,
      imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/sauvage.jpg'
    }
  });
  await prisma.varianteAtributo.createMany({
    data: [
      { varianteId: sauvage200.id, valorId: val200ml.id },
      { varianteId: sauvage200.id, valorId: valEDT.id },
      { varianteId: sauvage200.id, valorId: valHombre.id }
    ]
  });

  // Chanel N°5
  const chanel5 = await prisma.producto.create({
    data: {
      nombre: 'N°5',
      marca: 'Chanel',
      descripcion: 'La esencia misma de la feminidad. Un bouquet floral aldehído, sublimado por un frasco icónico con líneas minimalistas.',
      esNuevo: false,
      categoria: 'Perfumes',
      gender: 'women'
    }
  });

  const chanel5_50 = await prisma.productoVariante.create({
    data: {
      productoId: chanel5.id,
      sku: 'CHANEL-N5-50-PARF',
      precio: 380.00,
      stock: 10,
      imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/chanel5.jpg'
    }
  });
  await prisma.varianteAtributo.createMany({
    data: [
      { varianteId: chanel5_50.id, valorId: val50ml.id },
      { varianteId: chanel5_50.id, valorId: valParfum.id },
      { varianteId: chanel5_50.id, valorId: valMujer.id }
    ]
  });

  const chanel5_100 = await prisma.productoVariante.create({
    data: {
      productoId: chanel5.id,
      sku: 'CHANEL-N5-100-EDP',
      precio: 550.00,
      stock: 12,
      imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/chanel5.jpg'
    }
  });
  await prisma.varianteAtributo.createMany({
    data: [
      { varianteId: chanel5_100.id, valorId: val100ml.id },
      { varianteId: chanel5_100.id, valorId: valEDP.id },
      { varianteId: chanel5_100.id, valorId: valMujer.id }
    ]
  });

  // Creed Aventus
  const creed = await prisma.producto.create({
    data: {
      nombre: 'Aventus',
      marca: 'Creed',
      descripcion: 'Celebrando la fuerza, el poder y el éxito, esta fragancia gourmet afrutada y rica es perfecta para el hombre contemporáneo audaz.',
      esNuevo: true,
      categoria: 'Perfumes',
      gender: 'men'
    }
  });

  const creed100 = await prisma.productoVariante.create({
    data: {
      productoId: creed.id,
      sku: 'CREED-AV-100-EDP',
      precio: 950.00,
      stock: 6,
      imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/aventus.jpg'
    }
  });
  await prisma.varianteAtributo.createMany({
    data: [
      { varianteId: creed100.id, valorId: val100ml.id },
      { varianteId: creed100.id, valorId: valEDP.id },
      { varianteId: creed100.id, valorId: valHombre.id }
    ]
  });

  // Bleu de Chanel
  const bleu = await prisma.producto.create({
    data: {
      nombre: 'Bleu de Chanel',
      marca: 'Chanel',
      descripcion: 'El elogio de la libertad masculina en un acorde aromático amaderado con una estela cautivadora. Un aroma atemporal y sensual.',
      esNuevo: true,
      categoria: 'Perfumes',
      gender: 'men'
    }
  });

  const bleu100 = await prisma.productoVariante.create({
    data: {
      productoId: bleu.id,
      sku: 'CHANEL-BLEU-100-EDP',
      precio: 490.00,
      stock: 20,
      imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/bleu.jpg'
    }
  });
  await prisma.varianteAtributo.createMany({
    data: [
      { varianteId: bleu100.id, valorId: val100ml.id },
      { varianteId: bleu100.id, valorId: valEDP.id },
      { varianteId: bleu100.id, valorId: valHombre.id }
    ]
  });

  // Tom Ford Black Orchid
  const blackOrchid = await prisma.producto.create({
    data: {
      nombre: 'Black Orchid',
      marca: 'Tom Ford',
      descripcion: 'Una fragancia lujosa y sensual de acordes oscuros e intrigantes, combinada con una rica poción de orquídeas negras y especias.',
      esNuevo: false,
      categoria: 'Perfumes',
      gender: 'unisex'
    }
  });

  const blackOrchid50 = await prisma.productoVariante.create({
    data: {
      productoId: blackOrchid.id,
      sku: 'TF-BLORQ-50-EDP',
      precio: 420.00,
      stock: 4,
      imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/black_orchid.jpg'
    }
  });
  await prisma.varianteAtributo.createMany({
    data: [
      { varianteId: blackOrchid50.id, valorId: val50ml.id },
      { varianteId: blackOrchid50.id, valorId: valEDP.id },
      { varianteId: blackOrchid50.id, valorId: valUnisex.id }
    ]
  });

  const blackOrchid100 = await prisma.productoVariante.create({
    data: {
      productoId: blackOrchid.id,
      sku: 'TF-BLORQ-100-EDP',
      precio: 610.00,
      stock: 7,
      imagenUrl: 'https://ffjnvykvmiugjvwrswkt.supabase.co/storage/v1/object/public/perfumes/black_orchid.jpg'
    }
  });
  await prisma.varianteAtributo.createMany({
    data: [
      { varianteId: blackOrchid100.id, valorId: val100ml.id },
      { varianteId: blackOrchid100.id, valorId: valEDP.id },
      { varianteId: blackOrchid100.id, valorId: valUnisex.id }
    ]
  });

  // 3. Crear Usuarios de Prueba (Cliente, Administrador, Motorizado)
  console.log('Creando cuentas de usuarios de prueba...');
  const saltRounds = 10;
  const hashPassword = (pw: string) => bcrypt.hashSync(pw, saltRounds);

  // Admin
  await prisma.usuario.create({
    data: {
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

  // Motorizado
  const motorizadoUser = await prisma.usuario.create({
    data: {
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

  // Cliente de prueba
  await prisma.usuario.create({
    data: {
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

  console.log('Inicialización completada con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante la inicialización:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
