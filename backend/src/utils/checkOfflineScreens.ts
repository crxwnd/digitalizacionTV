// backend/src/utils/checkOfflineScreens.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tiempo sin heartbeat para considerar una pantalla offline (en minutos)
const OFFLINE_THRESHOLD_MINUTES = 5;

export const checkOfflineScreens = async (): Promise<void> => {
  try {
    const thresholdTime = new Date();
    thresholdTime.setMinutes(thresholdTime.getMinutes() - OFFLINE_THRESHOLD_MINUTES);

    // Buscar pantallas que deberían estar offline
    const offlineScreens = await prisma.screen.findMany({
      where: {
        online: true,
        OR: [
          {
            lastHeartbeat: {
              lt: thresholdTime,
            },
          },
          {
            lastHeartbeat: null,
          },
        ],
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (offlineScreens.length > 0) {
      // Marcar como offline
      await prisma.screen.updateMany({
        where: {
          id: {
            in: offlineScreens.map((s) => s.id),
          },
        },
        data: {
          online: false,
        },
      });

      console.log(
        `✅ ${offlineScreens.length} pantalla(s) marcada(s) como offline:`,
        offlineScreens.map((s) => s.code).join(', ')
      );
    }
  } catch (error) {
    console.error('❌ Error al verificar pantallas offline:', error);
  }
};

// Ejecutar cada minuto
export const startOfflineChecker = (): void => {
  console.log('🔄 Iniciando verificación automática de pantallas offline...');
  
  // Ejecutar inmediatamente
  checkOfflineScreens();
  
  // Luego cada minuto
  setInterval(checkOfflineScreens, 60 * 1000);
};