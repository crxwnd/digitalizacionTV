// backend/src/controllers/content.controller.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// 📋 Obtener todo el contenido
export const getAllContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, userId } = req.user!;
    
    let content;
    if (role === 'ADMIN') {
      // Admin ve todo
      content = await prisma.content.findMany({
        include: {
          createdBy: {
            select: { name: true, email: true }
          },
          area: {
            select: { id: true, name: true }
          },
          screens: {
            include: {
              screen: {
                select: { id: true, name: true, code: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Manager solo ve contenido de sus áreas
      const userAreas = await prisma.area.findMany({
        where: { managerId: userId },
        select: { id: true }
      });
      
      const areaIds = userAreas.map(a => a.id);
      
      content = await prisma.content.findMany({
        where: {
          OR: [
            { areaId: { in: areaIds } },
            { createdById: userId }
          ]
        },
        include: {
          createdBy: {
            select: { name: true, email: true }
          },
          area: {
            select: { id: true, name: true }
          },
          screens: {
            include: {
              screen: {
                select: { id: true, name: true, code: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    res.json(content);
  } catch (error) {
    console.error('Error al obtener contenido:', error);
    res.status(500).json({ error: 'Error al obtener contenido' });
  }
};

// 🔍 Obtener contenido por ID
export const getContentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const content = await prisma.content.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        area: {
          select: { id: true, name: true }
        },
        screens: {
          include: {
            screen: true
          }
        }
      }
    });
    
    if (!content) {
      res.status(404).json({ error: 'Contenido no encontrado' });
      return;
    }
    
    res.json(content);
  } catch (error) {
    console.error('Error al obtener contenido:', error);
    res.status(500).json({ error: 'Error al obtener contenido' });
  }
};

// ➕ Crear contenido
export const createContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, type, url, fileSize, duration, areaId } = req.body;
    const { userId } = req.user!;
    
    const content = await prisma.content.create({
      data: {
        name,
        description,
        type,
        url,
        fileSize: fileSize ? parseInt(fileSize) : null,
        duration: duration ? parseInt(duration) : null,
        areaId: areaId ? parseInt(areaId) : null,
        createdById: userId
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        area: {
          select: { id: true, name: true }
        }
      }
    });
    
    res.status(201).json(content);
  } catch (error) {
    console.error('Error al crear contenido:', error);
    res.status(500).json({ error: 'Error al crear contenido' });
  }
};

// ✏️ Actualizar contenido
export const updateContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, type, url, fileSize, duration, areaId, active } = req.body;
    
    const content = await prisma.content.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        type,
        url,
        fileSize: fileSize ? parseInt(fileSize) : null,
        duration: duration ? parseInt(duration) : null,
        areaId: areaId ? parseInt(areaId) : null,
        active
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        area: {
          select: { id: true, name: true }
        }
      }
    });
    
    res.json(content);
  } catch (error) {
    console.error('Error al actualizar contenido:', error);
    res.status(500).json({ error: 'Error al actualizar contenido' });
  }
};

// 🗑️ Eliminar contenido
export const deleteContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.content.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Contenido eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar contenido:', error);
    res.status(500).json({ error: 'Error al eliminar contenido' });
  }
};

// 🔗 Asignar contenido a pantallas
export const assignContentToScreens = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { screenIds, duration, order } = req.body;
    
    // Eliminar asignaciones anteriores
    await prisma.contentScreen.deleteMany({
      where: { contentId: parseInt(id) }
    });
    
    // Crear nuevas asignaciones
    const assignments = await Promise.all(
      screenIds.map((screenId: number, index: number) =>
        prisma.contentScreen.create({
          data: {
            contentId: parseInt(id),
            screenId,
            duration: duration || 10,
            order: order !== undefined ? order : index
          }
        })
      )
    );
    
    res.json(assignments);
  } catch (error) {
    console.error('Error al asignar contenido:', error);
    res.status(500).json({ error: 'Error al asignar contenido' });
  }
};

// 📺 Obtener contenido para una pantalla específica
export const getContentForScreen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    
    const screen = await prisma.screen.findUnique({
      where: { code },
      include: {
        assignedContent: {
          include: {
            content: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!screen) {
      res.status(404).json({ error: 'Pantalla no encontrada' });
      return;
    }
    
    const content = screen.assignedContent
      .filter(ac => ac.content && ac.content.active)
      .map(ac => ({
        ...ac.content,
        displayDuration: ac.duration,
        order: ac.order
      }));
    
    res.json(content);
  } catch (error) {
    console.error('Error al obtener contenido de pantalla:', error);
    res.status(500).json({ error: 'Error al obtener contenido' });
  }
};