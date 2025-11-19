// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Hash de las contraseñas
  const adminPassword = await bcrypt.hash('admin123', 10);
  const gestorPassword = await bcrypt.hash('gestor123', 10);

  // Crear o actualizar Admin Principal
  const admin = await prisma.user.upsert({
    where: { email: 'admin@digitalizacion.com' },
    update: {
      password: adminPassword,
      // El campo active se mantiene como está o usa el default
    },
    create: {
      email: 'admin@digitalizacion.com',
      name: 'Administrador Principal',
      password: adminPassword,
      role: 'ADMIN',
      // active usa el default (true)
    },
  });

  console.log('✅ Admin creado/actualizado:', admin.email);

  // Crear o actualizar Gestor
  const gestor = await prisma.user.upsert({
    where: { email: 'gestor@digitalizacion.com' },
    update: {
      password: gestorPassword,
      // El campo active se mantiene como está o usa el default
    },
    create: {
      email: 'gestor@digitalizacion.com',
      name: 'Gestor de Área',
      password: gestorPassword,
      role: 'MANAGER',
      // active usa el default (true)
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