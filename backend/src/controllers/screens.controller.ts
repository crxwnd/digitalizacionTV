// backend/src/controllers/screens.controller.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';

const prisma = new PrismaClient();

// 💓 Heartbeat CORREGIDO - acepta código en el path
export const heartbeat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;  // Recibe el código desde el path
    const { currentContent, status } = req.body;

    console.log('💓 Heartbeat recibido de pantalla:', code);

    const screen = await prisma.screen.findUnique({
      where: { code },
    });

    if (!screen) {
      console.error('❌ Pantalla no encontrada:', code);
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    // No requiere autenticación para heartbeat
    // Actualizar estado de la pantalla
    const updatedScreen = await prisma.screen.update({
      where: { code },
      data: {
        online: true,
        lastHeartbeat: new Date(),
        currentContent: currentContent || screen.currentContent,
      },
      select: {
        id: true,
        code: true,
        name: true,
        online: true,
        lastHeartbeat: true,
        currentContent: true,
        areaId: true,
      },
    });

    // Emitir estado actualizado por WebSocket
    io.emit('screen-status-update', {
      screenCode: code,
      online: true,
      lastHeartbeat: new Date(),
      currentContent,
    });

    res.json({
      success: true,
      screen: updatedScreen,
      message: 'Heartbeat registrado correctamente',
    });
  } catch (error) {
    console.error('❌ Error en heartbeat:', error);
    res.status(500).json({ error: 'Error en heartbeat' });
  }
};

// 📋 Obtener todas las pantallas
export const getAllScreens = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let whereClause = {};

    if (userRole === 'MANAGER') {
      whereClause = {
        area: {
          managerId: userId,
        },
      };
    }

    const screens = await prisma.screen.findMany({
      where: whereClause,
      include: {
        area: {
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Verificar pantallas offline (más de 60 segundos sin heartbeat)
    const screensWithStatus = screens.map(screen => {
      const isOffline = screen.lastHeartbeat 
        ? new Date().getTime() - new Date(screen.lastHeartbeat).getTime() > 60000
        : true;
      
      if (isOffline && screen.online) {
        // Actualizar estado a offline
        prisma.screen.update({
          where: { id: screen.id },
          data: { online: false }
        }).catch(console.error);
      }

      return {
        ...screen,
        online: !isOffline && screen.online,
      };
    });

    res.json(screensWithStatus);
  } catch (error) {
    console.error('Error al obtener pantallas:', error);
    res.status(500).json({ error: 'Error al obtener pantallas' });
  }
};

// 🔍 Obtener pantalla por código
export const getScreenByCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const screen = await prisma.screen.findUnique({
      where: { code },
      include: {
        area: true,
      },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    res.json(screen);
  } catch (error) {
    console.error('Error al obtener pantalla:', error);
    res.status(500).json({ error: 'Error al obtener pantalla' });
  }
};

// ➕ Registrar nueva pantalla
export const registerScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, ipAddress, areaId } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    // Verificar permisos sobre el área
    if (userRole === 'MANAGER') {
      const area = await prisma.area.findFirst({
        where: {
          id: areaId,
          managerId: userId,
        },
      });

      if (!area) {
        res.status(403).json({ error: 'No tienes permisos sobre esta área' });
        return;
      }
    }

    // Generar código único
    const code = 'SCR-' + Math.random().toString(36).substr(2, 8).toUpperCase();

    const screen = await prisma.screen.create({
      data: {
        name,
        code,
        ipAddress,
        areaId,
        approved: userRole === 'ADMIN', // Auto-aprobar si es admin
        online: false,
      },
      include: {
        area: true,
      },
    });

    res.status(201).json(screen);
  } catch (error) {
    console.error('Error al registrar pantalla:', error);
    res.status(500).json({ error: 'Error al registrar pantalla' });
  }
};

// ✅ Aprobar pantalla
export const approveScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const screen = await prisma.screen.update({
      where: { id: parseInt(id) },
      data: { approved: true },
      include: {
        area: true,
      },
    });

    // Notificar por WebSocket
    io.emit('screen-approved', {
      screenId: screen.id,
      screenCode: screen.code,
      areaId: screen.areaId,
    });

    res.json(screen);
  } catch (error) {
    console.error('Error al aprobar pantalla:', error);
    res.status(500).json({ error: 'Error al aprobar pantalla' });
  }
};

// 📊 Obtener estadísticas
export const getScreenStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let whereClause = {};

    if (userRole === 'MANAGER') {
      whereClause = {
        area: {
          managerId: userId,
        },
      };
    }

    const [total, online, offline, approved, pending] = await Promise.all([
      prisma.screen.count({ where: whereClause }),
      prisma.screen.count({ where: { ...whereClause, online: true } }),
      prisma.screen.count({ where: { ...whereClause, online: false } }),
      prisma.screen.count({ where: { ...whereClause, approved: true } }),
      prisma.screen.count({ where: { ...whereClause, approved: false } }),
    ]);

    res.json({
      total,
      online,
      offline,
      approved,
      pending,
      healthRate: total > 0 ? ((online / total) * 100).toFixed(1) : 0,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Los demás métodos continúan igual...
export const getScreenById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const screen = await prisma.screen.findUnique({
      where: { id: parseInt(id) },
      include: {
        area: true,
      },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    res.json(screen);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener pantalla' });
  }
};

export const updateScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, ipAddress, areaId } = req.body;

    const screen = await prisma.screen.update({
      where: { id: parseInt(id) },
      data: {
        name,
        ipAddress,
        areaId,
      },
      include: {
        area: true,
      },
    });

    res.json(screen);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar pantalla' });
  }
};

export const deleteScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.screen.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Pantalla eliminada correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al eliminar pantalla' });
  }
};

export const rejectScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const screen = await prisma.screen.update({
      where: { id: parseInt(id) },
      data: { approved: false },
      include: {
        area: true,
      },
    });

    res.json(screen);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al rechazar pantalla' });
  }
};
