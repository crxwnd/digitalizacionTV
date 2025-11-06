// backend/src/controllers/screens.controller.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { generateScreenCode } from '../utils/screenCode';

const prisma = new PrismaClient();

// 📋 Listar pantallas (ADMIN ve todas, MANAGER solo de sus áreas)
export const getAllScreens = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let screens;

    if (userRole === 'ADMIN') {
      // Admin ve todas las pantallas
      screens = await prisma.screen.findMany({
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
    }

    res.json(screens);
  } catch (error) {
    console.error('Error al listar pantallas:', error);
    res.status(500).json({ error: 'Error al listar pantallas' });
  }
};

// 🔍 Obtener pantalla por ID
export const getScreenById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const screen = await prisma.screen.findUnique({
      where: { id: parseInt(id) },
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
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    // Si es MANAGER, verificar que sea de su área
    if (userRole === 'MANAGER' && screen.area.managerId !== userId) {
      res.status(403).json({ error: 'No tienes permiso para ver esta pantalla' });
      return;
    }

    res.json(screen);
  } catch (error) {
    console.error('Error al obtener pantalla:', error);
    res.status(500).json({ error: 'Error al obtener pantalla' });
  }
};

// 🔍 Obtener pantalla por código (para el player)
export const getScreenByCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const screen = await prisma.screen.findUnique({
      where: { code },
      include: {
        area: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    if (!screen.approved) {
      res.status(403).json({ error: 'Pantalla pendiente de aprobación' });
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
    const { name, ip, areaId } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    // Validar datos requeridos
    if (!name || !areaId) {
      res.status(400).json({ error: 'Nombre y área son requeridos' });
      return;
    }

    // Verificar que el área existe
    const area = await prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      res.status(404).json({ error: 'Área no encontrada' });
      return;
    }

    // Si es MANAGER, verificar que sea su área
    if (userRole === 'MANAGER' && area.managerId !== userId) {
      res.status(403).json({ error: 'No tienes permiso para registrar pantallas en esta área' });
      return;
    }

    // Verificar si la IP ya existe (si se proporciona)
    if (ip) {
      const existingScreen = await prisma.screen.findUnique({
        where: { ip },
      });

      if (existingScreen) {
        res.status(409).json({ error: 'Ya existe una pantalla con esta IP' });
        return;
      }
    }

    // Generar código único
    let code: string;
    let codeExists = true;

    while (codeExists) {
      code = generateScreenCode();
      const existing = await prisma.screen.findUnique({
        where: { code },
      });
      codeExists = !!existing;
    }

    // Crear pantalla
    const screen = await prisma.screen.create({
      data: {
        name,
        code: code!,
        ip,
        areaId,
        approved: userRole === 'ADMIN', // Auto-aprobar si es ADMIN
        online: false,
      },
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
    const { name, ip, areaId } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.id;

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

    // Si es MANAGER, verificar que sea de su área
    if (userRole === 'MANAGER' && existingScreen.area.managerId !== userId) {
      res.status(403).json({ error: 'No tienes permiso para editar esta pantalla' });
      return;
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (name) updateData.name = name;

    if (ip && ip !== existingScreen.ip) {
      // Verificar que la nueva IP no esté en uso
      const ipExists = await prisma.screen.findUnique({
        where: { ip },
      });

      if (ipExists) {
        res.status(409).json({ error: 'La IP ya está en uso' });
        return;
      }

      updateData.ip = ip;
    }

    if (areaId && areaId !== existingScreen.areaId) {
      const area = await prisma.area.findUnique({
        where: { id: areaId },
      });

      if (!area) {
        res.status(404).json({ error: 'Área no encontrada' });
        return;
      }

      // Si es MANAGER, verificar que la nueva área sea suya
      if (userRole === 'MANAGER' && area.managerId !== userId) {
        res.status(403).json({ error: 'No tienes permiso para mover la pantalla a esta área' });
        return;
      }

      updateData.areaId = areaId;
    }

    // Actualizar pantalla
    const updatedScreen = await prisma.screen.update({
      where: { id: parseInt(id) },
      data: updateData,
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
    });

    res.json(updatedScreen);
  } catch (error) {
    console.error('Error al actualizar pantalla:', error);
    res.status(500).json({ error: 'Error al actualizar pantalla' });
  }
};

// 🗑️ Eliminar pantalla
export const deleteScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

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

    // Si es MANAGER, verificar que sea de su área
    if (userRole === 'MANAGER' && screen.area.managerId !== userId) {
      res.status(403).json({ error: 'No tienes permiso para eliminar esta pantalla' });
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

    const screen = await prisma.screen.findUnique({
      where: { id: parseInt(id) },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    if (screen.approved) {
      res.status(400).json({ error: 'La pantalla ya está aprobada' });
      return;
    }

    const updatedScreen = await prisma.screen.update({
      where: { id: parseInt(id) },
      data: { approved: true },
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
    });

    res.json(updatedScreen);
  } catch (error) {
    console.error('Error al aprobar pantalla:', error);
    res.status(500).json({ error: 'Error al aprobar pantalla' });
  }
};

// ❌ Rechazar pantalla (solo ADMIN)
export const rejectScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const screen = await prisma.screen.findUnique({
      where: { id: parseInt(id) },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    const updatedScreen = await prisma.screen.update({
      where: { id: parseInt(id) },
      data: { approved: false },
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
    });

    res.json(updatedScreen);
  } catch (error) {
    console.error('Error al rechazar pantalla:', error);
    res.status(500).json({ error: 'Error al rechazar pantalla' });
  }
};

// 💓 Heartbeat (actualizar estado online de la pantalla)
export const heartbeat = async (req: AuthRequest, res: Response): Promise<void> => {
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

// 📊 Obtener estadísticas de pantallas
export const getScreenStats = async (req: AuthRequest, res: Response): Promise<void> => {
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