// backend/src/controllers/areas.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';

// 📋 Listar áreas (ADMIN ve todas, MANAGER solo las suyas)
export const getAllAreas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    let areas;

    if (userRole === 'ADMIN') {
      // Admin ve todas las áreas
      areas = await prisma.area.findMany({
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          screens: {
            select: {
              id: true,
              name: true,
              code: true,
              online: true,
              approved: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Manager solo ve sus áreas
      areas = await prisma.area.findMany({
        where: {
          managerId: userId,
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          screens: {
            select: {
              id: true,
              name: true,
              code: true,
              online: true,
              approved: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    res.json(areas);
  } catch (error) {
    console.error('Error al listar áreas:', error);
    res.status(500).json({ error: 'Error al listar áreas' });
  }
};

// 🔍 Obtener área por ID
export const getAreaById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    const area = await prisma.area.findUnique({
      where: { id: parseInt(id) },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        screens: {
          select: {
            id: true,
            name: true,
            code: true,
            ipAddress: true,
            online: true,
            approved: true,
            lastHeartbeat: true,
            currentContent: true,
          },
        },
      },
    });

    if (!area) {
      res.status(404).json({ error: 'Área no encontrada' });
      return;
    }

    // Si es MANAGER, verificar que sea su área
    if (userRole === 'MANAGER' && area.managerId !== userId) {
      res.status(403).json({ error: 'No tienes permiso para ver esta área' });
      return;
    }

    res.json(area);
  } catch (error) {
    console.error('Error al obtener área:', error);
    res.status(500).json({ error: 'Error al obtener área' });
  }
};

// ➕ Crear nueva área (solo ADMIN)
export const createArea = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, managerId } = req.body;

    // Validar datos requeridos
    if (!name || !managerId) {
      res.status(400).json({ error: 'Nombre y manager son requeridos' });
      return;
    }

    // Verificar que el manager existe y es MANAGER
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      res.status(404).json({ error: 'Manager no encontrado' });
      return;
    }

    if (manager.role !== 'MANAGER') {
      res.status(400).json({ error: 'El usuario seleccionado no es un Manager' });
      return;
    }

    // Crear área
    const area = await prisma.area.create({
      data: {
        name,
        description,
        managerId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(area);
  } catch (error) {
    console.error('Error al crear área:', error);
    res.status(500).json({ error: 'Error al crear área' });
  }
};

// ✏️ Actualizar área
export const updateArea = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, managerId } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    // Verificar que el área existe
    const existingArea = await prisma.area.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingArea) {
      res.status(404).json({ error: 'Área no encontrada' });
      return;
    }

    // Si es MANAGER, verificar que sea su área
    if (userRole === 'MANAGER' && existingArea.managerId !== userId) {
      res.status(403).json({ error: 'No tienes permiso para editar esta área' });
      return;
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Solo ADMIN puede cambiar el manager
    if (managerId && userRole === 'ADMIN') {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
      });

      if (!manager) {
        res.status(404).json({ error: 'Manager no encontrado' });
        return;
      }

      if (manager.role !== 'MANAGER') {
        res.status(400).json({ error: 'El usuario seleccionado no es un Manager' });
        return;
      }

      updateData.managerId = managerId;
    }

    // Actualizar área
    const updatedArea = await prisma.area.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        screens: {
          select: {
            id: true,
            name: true,
            code: true,
            online: true,
          },
        },
      },
    });

    res.json(updatedArea);
  } catch (error) {
    console.error('Error al actualizar área:', error);
    res.status(500).json({ error: 'Error al actualizar área' });
  }
};

// 🗑️ Eliminar área (solo ADMIN)
export const deleteArea = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar que el área existe
    const area = await prisma.area.findUnique({
      where: { id: parseInt(id) },
      include: {
        screens: true,
      },
    });

    if (!area) {
      res.status(404).json({ error: 'Área no encontrada' });
      return;
    }

    // Verificar si tiene pantallas asociadas
    if (area.screens.length > 0) {
      res.status(400).json({ 
        error: 'No se puede eliminar un área con pantallas asociadas',
        screensCount: area.screens.length,
      });
      return;
    }

    // Eliminar área
    await prisma.area.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Área eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar área:', error);
    res.status(500).json({ error: 'Error al eliminar área' });
  }
};