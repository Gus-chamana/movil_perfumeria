import prisma from './config/db';

async function checkUsers() {
  try {
    console.log("🔍 Consultando usuarios registrados en tu Supabase...");
    const users = await prisma.usuarios.findMany({
      include: {
        datos_personales: true
      }
    });

    if (users.length === 0) {
      console.log("⚠️ No hay usuarios registrados en la base de datos.");
      return;
    }

    console.log(`📊 Se encontraron ${users.length} usuarios registrados:\n`);
    users.forEach((user, index) => {
      console.log(`👤 Usuario #${index + 1}:`);
      console.log(`   📧 Correo (Email): ${user.email}`);
      console.log(`   🛡️ Rol: ${user.rol}`);
      console.log(`   📝 Nombre: ${user.datos_personales?.nombre || 'N/A'} ${user.datos_personales?.apellido_paterno || ''}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log("--------------------------------------");
    });

  } catch (error) {
    console.error("❌ Error al recuperar usuarios:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
