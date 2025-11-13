const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const gestorPassword = await bcrypt.hash('gestor123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@digitalizacion.com' },
    update: {
      password: adminPassword,
    },
    create: {
      email: 'admin@digitalizacion.com',
      name: 'Administrador Principal',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin creado/actualizado:', admin.email);

  const gestor = await prisma.user.upsert({
    where: { email: 'gestor@digitalizacion.com' },
    update: {
      password: gestorPassword,
    },
    create: {
      email: 'gestor@digitalizacion.com',
      name: 'Gestor de Área',
      password: gestorPassword,
      role: 'MANAGER',
    },
  });

  console.log('✅ Gestor creado/actualizado:', gestor.email);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📝 Credenciales:');
  console.log('   Admin: admin@digitalizacion.com / admin123');
  console.log('   Gestor: gestor@digitalizacion.com / gestor123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });