// backend/src/controllers/content.controller.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// 📤 Subir contenido multimedia
export const uploadContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, type, areaId, duration, schedule } = req.body;
    const file = req.file;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!file) {
      res.status(400).json({ error: 'No se proporcionó archivo' });
      return;
    }

    // Verificar permisos sobre el área
    if (userRole === 'MANAGER' && areaId) {
      const area = await prisma.area.findFirst({
        where: {
          id: parseInt(areaId),
          managerId: userId,
        },
      });

      if (!area) {
        // Eliminar archivo subido
        await fs.unlink(file.path).catch(console.error);
        res.status(403).json({ error: 'No tienes permisos sobre esta área' });
        return;
      }
    }

    // Crear registro en base de datos
    const content = await prisma.content.create({
      data: {
        title,
        description,
        type: type || file.mimetype.split('/')[0].toUpperCase(),
        filePath: `/uploads/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        duration: duration ? parseInt(duration) : null,
        uploadedById: userId!,
        areaId: areaId ? parseInt(areaId) : null,
        schedule: schedule ? JSON.parse(schedule) : null,
        active: true,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        area: true,
      },
    });

    // Notificar por WebSocket
    io.emit('content-uploaded', {
      contentId: content.id,
      title: content.title,
      type: content.type,
      areaId: content.areaId,
      uploadedBy: content.uploadedBy.name,
    });

    res.status(201).json({
      success: true,
      content,
      message: 'Contenido subido exitosamente',
    });
  } catch (error) {
    console.error('Error al subir contenido:', error);
    // Eliminar archivo si hay error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ error: 'Error al subir contenido' });
  }
};

// 📋 Listar contenido
export const getAllContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const { areaId, type, active } = req.query;

    let whereClause: any = {};

    // Filtrar por área si es manager
    if (userRole === 'MANAGER') {
      const managedAreas = await prisma.area.findMany({
        where: { managerId: userId },
        select: { id: true },
      });
      const areaIds = managedAreas.map(a => a.id);
      whereClause.areaId = { in: areaIds };
    }

    // Aplicar filtros opcionales
    if (areaId) whereClause.areaId = parseInt(areaId as string);
    if (type) whereClause.type = type;
    if (active !== undefined) whereClause.active = active === 'true';

    const content = await prisma.content.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        area: true,
        playlist: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(content);
  } catch (error) {
    console.error('Error al obtener contenido:', error);
    res.status(500).json({ error: 'Error al obtener contenido' });
  }
};

// 🗑️ Eliminar contenido
export const deleteContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const content = await prisma.content.findUnique({
      where: { id: parseInt(id) },
      include: {
        area: true,
      },
    });

    if (!content) {
      res.status(404).json({ error: 'Contenido no encontrado' });
      return;
    }

    // Verificar permisos
    if (userRole === 'MANAGER') {
      if (content.area?.managerId !== userId) {
        res.status(403).json({ error: 'No tienes permisos para eliminar este contenido' });
        return;
      }
    }

    // Eliminar archivo físico
    const filePath = path.join(process.env.UPLOAD_PATH || './uploads', path.basename(content.filePath));
    await fs.unlink(filePath).catch(console.error);

    // Eliminar de base de datos
    await prisma.content.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: 'Contenido eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar contenido:', error);
    res.status(500).json({ error: 'Error al eliminar contenido' });
  }
};

// 📝 Crear playlist
export const createPlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, contentIds, areaId, loop, shuffle } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Verificar permisos sobre el área
    if (userRole === 'MANAGER' && areaId) {
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

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description,
        areaId,
        createdById: userId!,
        loop: loop || true,
        shuffle: shuffle || false,
        active: true,
        contentIds: contentIds || [],
      },
      include: {
        area: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(playlist);
  } catch (error) {
    console.error('Error al crear playlist:', error);
    res.status(500).json({ error: 'Error al crear playlist' });
  }
};

// 📺 Asignar contenido a pantalla
export const assignContentToScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { screenCode, contentId, playlistId, immediate } = req.body;
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
        res.status(403).json({ error: 'No tienes permisos sobre esta pantalla' });
        return;
      }
    }

    // Obtener contenido o playlist
    let contentData;
    if (contentId) {
      const content = await prisma.content.findUnique({
        where: { id: contentId },
      });
      contentData = {
        type: 'content',
        id: contentId,
        url: content?.filePath,
        title: content?.title,
      };
    } else if (playlistId) {
      const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
      });
      contentData = {
        type: 'playlist',
        id: playlistId,
        items: playlist?.contentIds,
        loop: playlist?.loop,
        shuffle: playlist?.shuffle,
      };
    }

    // Actualizar pantalla
    await prisma.screen.update({
      where: { code: screenCode },
      data: {
        currentContent: JSON.stringify(contentData),
      },
    });

    // Emitir cambio inmediato por WebSocket si se requiere
    if (immediate) {
      io.to(`screen-${screenCode}`).emit('content-change', contentData);
    }

    res.json({
      success: true,
      message: 'Contenido asignado correctamente',
      immediate,
      contentData,
    });
  } catch (error) {
    console.error('Error al asignar contenido:', error);
    res.status(500).json({ error: 'Error al asignar contenido' });
  }
};

// 🔄 Actualizar contenido
export const updateContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, active, schedule } = req.body;

    const content = await prisma.content.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        active,
        schedule: schedule ? JSON.parse(schedule) : undefined,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        area: true,
      },
    });

    res.json(content);
  } catch (error) {
    console.error('Error al actualizar contenido:', error);
    res.status(500).json({ error: 'Error al actualizar contenido' });
  }
};

// 📊 Obtener estadísticas de contenido
export const getContentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let whereClause: any = {};

    if (userRole === 'MANAGER') {
      const managedAreas = await prisma.area.findMany({
        where: { managerId: userId },
        select: { id: true },
      });
      const areaIds = managedAreas.map(a => a.id);
      whereClause.areaId = { in: areaIds };
    }

    const [totalContent, totalPlaylists, activeContent, totalSize] = await Promise.all([
      prisma.content.count({ where: whereClause }),
      prisma.playlist.count({ where: whereClause }),
      prisma.content.count({ where: { ...whereClause, active: true } }),
      prisma.content.aggregate({
        where: whereClause,
        _sum: {
          fileSize: true,
        },
      }),
    ]);

    const contentByType = await prisma.content.groupBy({
      by: ['type'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    res.json({
      totalContent,
      totalPlaylists,
      activeContent,
      totalSizeGB: ((totalSize._sum.fileSize || 0) / (1024 * 1024 * 1024)).toFixed(2),
      contentByType: contentByType.map(item => ({
        type: item.type,
        count: item._count.id,
      })),
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
