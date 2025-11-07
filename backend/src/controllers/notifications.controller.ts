// backend/src/controllers/notifications.controller.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';

const prisma = new PrismaClient();

// 📢 Crear notificación/aviso
export const createNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      title, 
      message, 
      type, 
      priority, 
      areaId, 
      screenCodes, 
      duration,
      displayImmediately 
    } = req.body;
    
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

    // Crear notificación
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || 'INFO',
        priority: priority || 'NORMAL',
        areaId: areaId || null,
        screenCodes: screenCodes || [],
        duration: duration || 30, // 30 segundos por defecto
        createdById: userId!,
        active: true,
        displayedAt: displayImmediately ? new Date() : null,
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

    // Si debe mostrarse inmediatamente, enviar por WebSocket
    if (displayImmediately) {
      const notificationData = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        duration: notification.duration,
        timestamp: new Date(),
      };

      // Enviar a área específica
      if (areaId) {
        io.to(`area-${areaId}`).emit('urgent-notification', notificationData);
      }

      // Enviar a pantallas específicas
      if (screenCodes && screenCodes.length > 0) {
        screenCodes.forEach((code: string) => {
          io.to(`screen-${code}`).emit('urgent-notification', notificationData);
        });
      }

      // Si no hay área ni pantallas específicas, enviar a todos
      if (!areaId && (!screenCodes || screenCodes.length === 0)) {
        io.emit('urgent-notification', notificationData);
      }
    }

    res.status(201).json({
      success: true,
      notification,
      message: displayImmediately 
        ? 'Notificación enviada inmediatamente' 
        : 'Notificación programada correctamente',
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ error: 'Error al crear notificación' });
  }
};

// 📋 Listar notificaciones
export const getAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const { active, areaId, type, priority } = req.query;

    let whereClause: any = {};

    // Filtrar por área si es manager
    if (userRole === 'MANAGER') {
      const managedAreas = await prisma.area.findMany({
        where: { managerId: userId },
        select: { id: true },
      });
      const areaIds = managedAreas.map(a => a.id);
      whereClause.areaId = { in: [...areaIds, null] }; // Incluir notificaciones globales
    }

    // Aplicar filtros opcionales
    if (active !== undefined) whereClause.active = active === 'true';
    if (areaId) whereClause.areaId = parseInt(areaId as string);
    if (type) whereClause.type = type;
    if (priority) whereClause.priority = priority;

    const notifications = await prisma.notification.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

// ✏️ Actualizar notificación
export const updateNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, message, active, duration } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
      include: {
        area: true,
      },
    });

    if (!notification) {
      res.status(404).json({ error: 'Notificación no encontrada' });
      return;
    }

    // Verificar permisos
    if (userRole === 'MANAGER') {
      if (notification.area && notification.area.managerId !== userId) {
        res.status(403).json({ error: 'No tienes permisos para editar esta notificación' });
        return;
      }
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: {
        title,
        message,
        active,
        duration,
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

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error al actualizar notificación:', error);
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
};

// 🗑️ Eliminar notificación
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
      include: {
        area: true,
      },
    });

    if (!notification) {
      res.status(404).json({ error: 'Notificación no encontrada' });
      return;
    }

    // Verificar permisos
    if (userRole === 'MANAGER') {
      if (notification.area && notification.area.managerId !== userId) {
        res.status(403).json({ error: 'No tienes permisos para eliminar esta notificación' });
        return;
      }
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: 'Notificación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
};

// 🚨 Enviar alerta de emergencia
export const sendEmergencyAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message } = req.body;
    const userId = req.user?.id;

    // Crear notificación de emergencia
    const notification = await prisma.notification.create({
      data: {
        title: title || '🚨 ALERTA DE EMERGENCIA',
        message,
        type: 'EMERGENCY',
        priority: 'URGENT',
        duration: 60, // 1 minuto
        createdById: userId!,
        active: true,
        displayedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Enviar a TODAS las pantallas inmediatamente
    io.emit('emergency-alert', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      createdBy: notification.createdBy.name,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Alerta de emergencia enviada a todas las pantallas',
      notification,
    });
  } catch (error) {
    console.error('Error al enviar alerta de emergencia:', error);
    res.status(500).json({ error: 'Error al enviar alerta de emergencia' });
  }
};

// 📊 Obtener notificaciones activas para una pantalla
export const getActiveNotificationsForScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { screenCode } = req.params;

    // Obtener información de la pantalla
    const screen = await prisma.screen.findUnique({
      where: { code: screenCode },
      select: {
        id: true,
        areaId: true,
      },
    });

    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }

    // Obtener notificaciones activas para esta pantalla
    const notifications = await prisma.notification.findMany({
      where: {
        active: true,
        OR: [
          { areaId: screen.areaId }, // Notificaciones del área
          { areaId: null }, // Notificaciones globales
          { 
            screenCodes: {
              has: screenCode, // Notificaciones específicas para esta pantalla
            },
          },
        ],
      },
      orderBy: [
        { priority: 'desc' }, // Urgentes primero
        { createdAt: 'desc' },
      ],
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones activas:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones activas' });
  }
};

// 📊 Estadísticas de notificaciones
export const getNotificationStats = async (req: AuthRequest, res: Response): Promise<void> => {
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
      whereClause.areaId = { in: [...areaIds, null] };
    }

    const [total, active, emergency, today] = await Promise.all([
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { ...whereClause, active: true } }),
      prisma.notification.count({ where: { ...whereClause, type: 'EMERGENCY' } }),
      prisma.notification.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const byType = await prisma.notification.groupBy({
      by: ['type'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    const byPriority = await prisma.notification.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    res.json({
      total,
      active,
      emergency,
      today,
      byType: byType.map(item => ({
        type: item.type,
        count: item._count.id,
      })),
      byPriority: byPriority.map(item => ({
        priority: item.priority,
        count: item._count.id,
      })),
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};