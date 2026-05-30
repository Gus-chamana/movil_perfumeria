import prisma from './config/db';

async function test() {
  try {
    console.log("🔍 Conectando a Supabase a través de Prisma...");
    const count = await prisma.productos.count();
    console.log("📊 Total de productos en tu Supabase real:", count);
    if (count > 0) {
      const products = await prisma.productos.findMany({ take: 3 });
      console.log("✨ Muestra de productos encontrados en Supabase:", JSON.stringify(products, null, 2));
    } else {
      console.log("⚠️ Tu base de datos de Supabase está vacía (0 productos).");
    }
  } catch (err) {
    console.error("❌ Error de Conexión a la Base de Datos:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
