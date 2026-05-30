import prisma from './config/db';

async function check() {
  try {
    console.log("🔍 Consultando la estructura de atributos en Supabase...");
    
    const atributos = await prisma.atributos.findMany();
    console.log("\n📊 Tabla 'atributos' en Supabase:");
    console.log(JSON.stringify(atributos, null, 2));

    const valores = await prisma.atributo_valores.findMany({
      include: {
        atributos: true
      }
    });
    console.log("\n📊 Tabla 'atributo_valores' en Supabase:");
    console.log(JSON.stringify(valores.map(v => ({
      id: v.id,
      atributo_id: v.atributo_id,
      atributo_nombre: v.atributos.nombre,
      valor: v.valor
    })), null, 2));

    const relaciones = await prisma.variante_atributos.findMany({
      take: 5
    });
    console.log("\n📊 Muestra de relaciones 'variante_atributos' en Supabase:");
    console.log(JSON.stringify(relaciones, null, 2));

  } catch (error) {
    console.error("❌ Error al inspeccionar atributos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
