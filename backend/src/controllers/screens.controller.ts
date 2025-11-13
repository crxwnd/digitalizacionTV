// backend/src/controllers/screens.controller.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 📋 Obtener todas las pantallas
export const getAllScreens = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, userId } = req.user!;
    
    let screens;
    if (role === 'ADMIN') {
      // Admin ve todas las pantallas
      screens = await prisma.screen.findMany({
        include: {
          area: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
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
      });
    } else {
      // Manager solo ve pantallas de sus áreas
      screens = await prisma.screen.findMany({
        where: {
          area: {
            managerId: userId,
          },
        },
        include: {
          area: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
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
      });
    }

    res.json(screens);
  } catch (error) {
    console.error('Error al obtener pantallas:', error);
    res.status(500).json({ error: 'Error al obtener pantallas' });
  }
};

// 🔍 Obtener pantalla por ID
export const getScreenById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const screen = await prisma.screen.findUnique({
      where: { id: parseInt(id) },
      include: {
        area: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    // Verificar permisos para Manager
    if (role === 'MANAGER' && screen.area?.managerId !== userId) {
      res.status(403).json({ error: 'No tienes permisos para ver esta pantalla' });
      return;
    }

    res.json(screen);
  } catch (error) {
    console.error('Error al obtener pantalla:', error);
    res.status(500).json({ error: 'Error al obtener pantalla' });
  }
};

// 🔍 Obtener pantalla por código (PÚBLICO - para player)
export const getScreenByCode = async (req: any, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const screen = await prisma.screen.findUnique({
      where: { code },
      include: {
        area: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    res.json(screen);
  } catch (error) {
    console.error('Error al obtener pantalla por código:', error);
    res.status(500).json({ error: 'Error al obtener pantalla' });
  }
};

// ➕ Registrar nueva pantalla
export const registerScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, location, ipAddress, areaId } = req.body;
    const { userId } = req.user!;

    // Validar datos requeridos
    if (!name || !ipAddress) {
      res.status(400).json({ error: 'Nombre e IP son requeridos' });
      return;
    }

    // Generar código único
    const code = `SCR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Crear pantalla
    const screen = await prisma.screen.create({
      data: {
        code,
        name,
        location,
        ipAddress,
        approved: false,
        online: false,
        createdById: userId,
        areaId: areaId ? parseInt(areaId) : null,
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(screen);
  } catch (error) {
    console.error('Error al registrar pantalla:', error);
    res.status(500).json({ error: 'Error al registrar pantalla' });
  }
};

// ✏️ Actualizar pantalla
export const updateScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, location, ipAddress, areaId } = req.body;
    const { role, userId } = req.user!;

    // Verificar que la pantalla existe
    const existingScreen = await prisma.screen.findUnique({
      where: { id: parseInt(id) },
      include: {
        area: true,
      },
    });

    if (!existingScreen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    // Verificar permisos para Manager
    if (role === 'MANAGER' && existingScreen.area?.managerId !== userId) {
      res.status(403).json({ error: 'No tienes permisos para actualizar esta pantalla' });
      return;
    }

    // Actualizar pantalla
    const screen = await prisma.screen.update({
      where: { id: parseInt(id) },
      data: {
        name,
        location,
        ipAddress,
        areaId: areaId ? parseInt(areaId) : null,
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(screen);
  } catch (error) {
    console.error('Error al actualizar pantalla:', error);
    res.status(500).json({ error: 'Error al actualizar pantalla' });
  }
};

// 🗑️ Eliminar pantalla
export const deleteScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    // Verificar que la pantalla existe
    const existingScreen = await prisma.screen.findUnique({
      where: { id: parseInt(id) },
      include: {
        area: true,
      },
    });

    if (!existingScreen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    // Verificar permisos para Manager
    if (role === 'MANAGER' && existingScreen.area?.managerId !== userId) {
      res.status(403).json({ error: 'No tienes permisos para eliminar esta pantalla' });
      return;
    }

    await prisma.screen.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Pantalla eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar pantalla:', error);
    res.status(500).json({ error: 'Error al eliminar pantalla' });
  }
};

// ✅ Aprobar pantalla (solo ADMIN)
export const approveScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const screen = await prisma.screen.update({
      where: { id: parseInt(id) },
      data: {
        approved: true,
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(screen);
  } catch (error) {
    console.error('Error al aprobar pantalla:', error);
    res.status(500).json({ error: 'Error al aprobar pantalla' });
  }
};

// ❌ Rechazar pantalla (solo ADMIN)
export const rejectScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const screen = await prisma.screen.update({
      where: { id: parseInt(id) },
      data: {
        approved: false,
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(screen);
  } catch (error) {
    console.error('Error al rechazar pantalla:', error);
    res.status(500).json({ error: 'Error al rechazar pantalla' });
  }
};

// 💓 Heartbeat (actualizar estado online de la pantalla) - PÚBLICO
export const heartbeat = async (req: any, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { currentContent } = req.body;

    const screen = await prisma.screen.findUnique({
      where: { code },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    if (!screen.approved) {
      res.status(403).json({ error: 'Pantalla no aprobada' });
      return;
    }

    // Actualizar heartbeat y estado online
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
        online: true,
        lastHeartbeat: true,
        currentContent: true,
      },
    });

    res.json(updatedScreen);
  } catch (error) {
    console.error('Error en heartbeat:', error);
    res.status(500).json({ error: 'Error en heartbeat' });
  }
};

// 📊 Obtener estadísticas de pantallas - PÚBLICO
export const getScreenStats = async (req: any, res: Response): Promise<void> => {
  try {
    const screens = await prisma.screen.findMany();
    
    const stats = {
      total: screens.length,
      online: screens.filter(s => s.online).length,
      offline: screens.filter(s => !s.online).length,
      approved: screens.filter(s => s.approved).length,
      pending: screens.filter(s => !s.approved).length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};