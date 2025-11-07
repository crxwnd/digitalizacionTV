// backend/src/controllers/monitor.controller.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';

const prisma = new PrismaClient();

// 📺 Obtener vista de monitoreo de un área
export const getAreaMonitor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { areaId } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    // Verificar permisos
    if (userRole === 'MANAGER') {
      const area = await prisma.area.findFirst({
        where: {
          id: parseInt(areaId),
          managerId: userId,
        },
      });

      if (!area) {
        res.status(403).json({ error: 'No tienes permisos para monitorear esta área' });
        return;
      }
    }

    // Obtener todas las pantallas del área con su estado actual
    const screens = await prisma.screen.findMany({
      where: {
        areaId: parseInt(areaId),
      },
      select: {
        id: true,
        code: true,
        name: true,
        ipAddress: true,
        online: true,
        lastHeartbeat: true,
        currentContent: true,
        approved: true,
        area: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Verificar estado real de las pantallas (offline si no hay heartbeat en 60 segundos)
    const screensWithRealStatus = screens.map(screen => {
      const isOffline = screen.lastHeartbeat 
        ? new Date().getTime() - new Date(screen.lastHeartbeat).getTime() > 60000
        : true;

      return {
        ...screen,
        online: !isOffline && screen.online,
        lastSeen: screen.lastHeartbeat 
          ? Math.floor((new Date().getTime() - new Date(screen.lastHeartbeat).getTime()) / 1000) + ' segundos'
          : 'Nunca',
        currentContent: screen.currentContent ? JSON.parse(screen.currentContent as string) : null,
      };
    });

    res.json({
      areaId: parseInt(areaId),
      screens: screensWithRealStatus,
      totalScreens: screens.length,
      onlineScreens: screensWithRealStatus.filter(s => s.online).length,
      offlineScreens: screensWithRealStatus.filter(s => !s.online).length,
    });
  } catch (error) {
    console.error('Error al obtener monitor del área:', error);
    res.status(500).json({ error: 'Error al obtener monitor del área' });
  }
};

// 🖥️ Obtener vista de monitoreo global
export const getGlobalMonitor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let whereClause = {};

    // Si es manager, solo ver sus áreas
    if (userRole === 'MANAGER') {
      const managedAreas = await prisma.area.findMany({
        where: { managerId: userId },
        select: { id: true },
      });
      const areaIds = managedAreas.map(a => a.id);
      whereClause = { areaId: { in: areaIds } };
    }

    // Obtener todas las áreas con sus pantallas
    const areas = await prisma.area.findMany({
      where: userRole === 'MANAGER' 
        ? { managerId: userId }
        : {},
      include: {
        screens: {
          select: {
            id: true,
            code: true,
            name: true,
            online: true,
            lastHeartbeat: true,
            currentContent: true,
            approved: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Procesar estado de pantallas por área
    const areasWithStatus = areas.map(area => {
      const screensWithStatus = area.screens.map(screen => {
        const isOffline = screen.lastHeartbeat 
          ? new Date().getTime() - new Date(screen.lastHeartbeat).getTime() > 60000
          : true;

        return {
          ...screen,
          online: !isOffline && screen.online,
          currentContent: screen.currentContent ? JSON.parse(screen.currentContent as string) : null,
        };
      });

      return {
        id: area.id,
        name: area.name,
        manager: area.manager,
        totalScreens: area.screens.length,
        onlineScreens: screensWithStatus.filter(s => s.online).length,
        offlineScreens: screensWithStatus.filter(s => !s.online).length,
        screens: screensWithStatus,
      };
    });

    // Estadísticas globales
    const totalScreens = areasWithStatus.reduce((acc, area) => acc + area.totalScreens, 0);
    const onlineScreens = areasWithStatus.reduce((acc, area) => acc + area.onlineScreens, 0);
    const offlineScreens = areasWithStatus.reduce((acc, area) => acc + area.offlineScreens, 0);

    res.json({
      areas: areasWithStatus,
      globalStats: {
        totalAreas: areas.length,
        totalScreens,
        onlineScreens,
        offlineScreens,
        healthRate: totalScreens > 0 ? ((onlineScreens / totalScreens) * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('Error al obtener monitor global:', error);
    res.status(500).json({ error: 'Error al obtener monitor global' });
  }
};

// 📸 Obtener captura de pantalla
export const getScreenCapture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { screenCode } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    // Verificar que la pantalla existe
    const screen = await prisma.screen.findUnique({
      where: { code: screenCode },
      include: {
        area: true,
      },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    // Verificar permisos
    if (userRole === 'MANAGER') {
      if (screen.area?.managerId !== userId) {
        res.status(403).json({ error: 'No tienes permisos para ver esta pantalla' });
        return;
      }
    }

    // Solicitar captura de pantalla por WebSocket
    io.to(`screen-${screenCode}`).emit('request-capture');

    // Esperar respuesta (con timeout)
    const capturePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando captura'));
      }, 5000);

      io.once(`capture-${screenCode}`, (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    try {
      const capture = await capturePromise;
      res.json({
        success: true,
        screenCode,
        capture,
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(408).json({ 
        error: 'No se pudo obtener la captura de pantalla',
        message: 'La pantalla no respondió a tiempo',
      });
    }
  } catch (error) {
    console.error('Error al obtener captura:', error);
    res.status(500).json({ error: 'Error al obtener captura' });
  }
};

// 🎮 Control remoto de pantalla
export const remoteControl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { screenCode } = req.params;
    const { action, data } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    // Verificar que la pantalla existe
    const screen = await prisma.screen.findUnique({
      where: { code: screenCode },
      include: {
        area: true,
      },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    // Verificar permisos
    if (userRole === 'MANAGER') {
      if (screen.area?.managerId !== userId) {
        res.status(403).json({ error: 'No tienes permisos para controlar esta pantalla' });
        return;
      }
    }

    // Acciones disponibles
    const validActions = [
      'play',
      'pause',
      'stop',
      'next',
      'previous',
      'volume',
      'refresh',
      'restart',
      'changeContent',
    ];

    if (!validActions.includes(action)) {
      res.status(400).json({ error: 'Acción no válida' });
      return;
    }

    // Enviar comando por WebSocket
    io.to(`screen-${screenCode}`).emit('remote-control', {
      action,
      data,
      timestamp: new Date(),
      controlledBy: req.user?.name,
    });

    // Registrar acción en la base de datos
    await prisma.screenLog.create({
      data: {
        screenId: screen.id,
        action: `REMOTE_${action.toUpperCase()}`,
        details: JSON.stringify({ action, data }),
        userId: userId!,
      },
    });

    res.json({
      success: true,
      message: `Comando '${action}' enviado a la pantalla`,
      screenCode,
      action,
      data,
    });
  } catch (error) {
    console.error('Error en control remoto:', error);
    res.status(500).json({ error: 'Error en control remoto' });
  }
};

// 📊 Obtener logs de pantalla
export const getScreenLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { screenCode } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    // Verificar que la pantalla existe
    const screen = await prisma.screen.findUnique({
      where: { code: screenCode },
      include: {
        area: true,
      },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    // Verificar permisos
    if (userRole === 'MANAGER') {
      if (screen.area?.managerId !== userId) {
        res.status(403).json({ error: 'No tienes permisos para ver logs de esta pantalla' });
        return;
      }
    }

    // Obtener logs
    const logs = await prisma.screenLog.findMany({
      where: {
        screenId: screen.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const totalLogs = await prisma.screenLog.count({
      where: {
        screenId: screen.id,
      },
    });

    res.json({
      logs,
      pagination: {
        total: totalLogs,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: totalLogs > parseInt(offset as string) + parseInt(limit as string),
      },
    });
  } catch (error) {
    console.error('Error al obtener logs:', error);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
};

// 🔄 Estado en tiempo real de todas las pantallas
export const getRealTimeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let whereClause = {};

    if (userRole === 'MANAGER') {
      const managedAreas = await prisma.area.findMany({
        where: { managerId: userId },
        select: { id: true },
      });
      const areaIds = managedAreas.map(a => a.id);
      whereClause = { areaId: { in: areaIds } };
    }

    const screens = await prisma.screen.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        name: true,
        online: true,
        lastHeartbeat: true,
        currentContent: true,
        ipAddress: true,
        area: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Mapear estado en tiempo real
    const realTimeStatus = screens.map(screen => {
      const now = new Date().getTime();
      const lastSeen = screen.lastHeartbeat ? new Date(screen.lastHeartbeat).getTime() : 0;
      const secondsAgo = Math.floor((now - lastSeen) / 1000);
      
      let status = 'offline';
      if (secondsAgo < 30) status = 'online';
      else if (secondsAgo < 60) status = 'warning';

      return {
        code: screen.code,
        name: screen.name,
        area: screen.area?.name,
        status,
        lastSeen: secondsAgo > 0 ? `${secondsAgo}s` : 'Nunca',
        ipAddress: screen.ipAddress,
        currentContent: screen.currentContent ? JSON.parse(screen.currentContent as string) : null,
      };
    });

    res.json({
      timestamp: new Date(),
      screens: realTimeStatus,
      summary: {
        total: realTimeStatus.length,
        online: realTimeStatus.filter(s => s.status === 'online').length,
        warning: realTimeStatus.filter(s => s.status === 'warning').length,
        offline: realTimeStatus.filter(s => s.status === 'offline').length,
      },
    });
  } catch (error) {
    console.error('Error al obtener estado en tiempo real:', error);
    res.status(500).json({ error: 'Error al obtener estado en tiempo real' });
  }
};
