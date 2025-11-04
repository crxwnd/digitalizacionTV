// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear usuario Admin principal
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@digitalizacion.com' },
    update: {},
    create: {
      email: 'admin@digitalizacion.com',
      name: 'Administrador Principal',
      password: hashedPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('✅ Usuario Admin creado:', admin.email);
  console.log('📧 Email: admin@digitalizacion.com');
  console.log('🔑 Password: admin123');
  console.log('');

  // Crear usuario Manager de ejemplo
  const managerPassword = await bcrypt.hash('manager123', 10);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@digitalizacion.com' },
    update: {},
    create: {
      email: 'manager@digitalizacion.com',
      name: 'Manager de Ejemplo',
      password: managerPassword,
      role: 'MANAGER',
      active: true,
    },
  });

  console.log('✅ Usuario Manager creado:', manager.email);
  console.log('📧 Email: manager@digitalizacion.com');
  console.log('🔑 Password: manager123');
  console.log('');

  // Crear área de ejemplo
  const area = await prisma.area.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Área Principal',
      description: 'Área de ejemplo para pruebas',
      managerId: manager.id,
    },
  });

  console.log('✅ Área creada:', area.name);
  console.log('');

  // Crear pantalla de ejemplo
  const screen = await prisma.screen.upsert({
    where: { code: 'SCR-DEMO001' },
    update: {},
    create: {
      name: 'Pantalla Demo',
      code: 'SCR-DEMO001',
      ip: '192.168.1.100',
      areaId: area.id,
      approved: true,
      online: false,
    },
  });

  console.log('✅ Pantalla creada:', screen.name, `(${screen.code})`);
  console.log('');

  console.log('🎉 Seed completado exitosamente!');
  console.log('');
  console.log('📝 Resumen:');
  console.log('   - Admin: admin@digitalizacion.com / admin123');
  console.log('   - Manager: manager@digitalizacion.com / manager123');
  console.log('   - Área: Área Principal');
  console.log('   - Pantalla: SCR-DEMO001');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });