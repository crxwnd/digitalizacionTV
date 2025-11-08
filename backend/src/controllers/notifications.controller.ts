// backend/src/controllers/notifications.controller.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// 📋 Obtener todas las notificaciones
export const getAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, userId } = req.user!;
    
    let notifications;
    if (role === 'ADMIN') {
      // Admin ve todas
      notifications = await prisma.notification.findMany({
        include: {
          createdBy: {
            select: { name: true, email: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    } else {
      // Manager solo ve las suyas y las de sus áreas
      const userAreas = await prisma.area.findMany({
        where: { managerId: userId },
        select: { id: true }
      });
      
      const areaIds = userAreas.map(a => a.id);
      
      notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { areaId: { in: areaIds } },
            { createdById: userId },
            { areaId: null } // Notificaciones globales
          ]
        },
        include: {
          createdBy: {
            select: { name: true, email: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    }
    
    res.json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

// 🔍 Obtener notificación por ID
export const getNotificationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    });
    
    if (!notification) {
      res.status(404).json({ error: 'Notificación no encontrada' });
      return;
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error al obtener notificación:', error);
    res.status(500).json({ error: 'Error al obtener notificación' });
  }
};

// ➕ Crear notificación
export const createNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, type, priority, startDate, endDate, areaId } = req.body;
    const { userId } = req.user!;
    
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || 'info',
        priority: priority || 1,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        areaId: areaId ? parseInt(areaId) : null,
        createdById: userId
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    });
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ error: 'Error al crear notificación' });
  }
};

// ✏️ Actualizar notificación
export const updateNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, message, type, priority, active, startDate, endDate, areaId } = req.body;
    
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: {
        title,
        message,
        type,
        priority,
        active,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        areaId: areaId ? parseInt(areaId) : null
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    });
    
    res.json(notification);
  } catch (error) {
    console.error('Error al actualizar notificación:', error);
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
};

// 🗑️ Eliminar notificación
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Notificación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
};

// 📢 Obtener notificaciones activas para el player
export const getActiveNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { areaId } = req.query;
    const now = new Date();
    
    const notifications = await prisma.notification.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ],
        ...(areaId ? {
          OR: [
            { areaId: parseInt(areaId as string) },
            { areaId: null }
          ]
        } : {})
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones activas:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};