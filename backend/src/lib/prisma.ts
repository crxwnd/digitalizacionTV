import { PrismaClient } from '@prisma/client';

// Singleton pattern para PrismaClient
// Previene múltiples instancias y memory leaks

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
