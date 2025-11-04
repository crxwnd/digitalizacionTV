// backend/src/controllers/users.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// 📋 Listar todos los usuarios (solo ADMIN)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        areas: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

// 🔍 Obtener un usuario por ID (solo ADMIN)
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        areas: {
          select: {
            id: true,
            name: true,
            description: true,
            screens: {
              select: {
                id: true,
                name: true,
                code: true,
                online: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

// ➕ Crear nuevo usuario (solo ADMIN)
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, name, password, role } = req.body;

    // Validar datos requeridos
    if (!email || !name || !password || !role) {
      res.status(400).json({ error: 'Email, nombre, contraseña y rol son requeridos' });
      return;
    }

    // Validar que el rol sea válido
    if (!['ADMIN', 'MANAGER', 'PLAYER'].includes(role)) {
      res.status(400).json({ error: 'Rol inválido. Debe ser ADMIN, MANAGER o PLAYER' });
      return;
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// ✏️ Actualizar usuario (solo ADMIN)
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, name, role, active, password } = req.body;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (email && email !== existingUser.email) {
      // Verificar que el nuevo email no esté en uso
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        res.status(409).json({ error: 'El email ya está en uso' });
        return;
      }

      updateData.email = email;
    }

    if (name) updateData.name = name;
    if (role && ['ADMIN', 'MANAGER', 'PLAYER'].includes(role)) {
      updateData.role = role;
    }
    if (typeof active === 'boolean') updateData.active = active;
    
    // Si se proporciona nueva contraseña
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// 🗑️ Eliminar usuario (solo ADMIN)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // No permitir que un admin se elimine a sí mismo
    if (req.user?.id === userId) {
      res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
      return;
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Eliminar usuario (las áreas y pantallas se eliminarán en cascada)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// 🔄 Activar/Desactivar usuario (solo ADMIN)
export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // No permitir que un admin se desactive a sí mismo
    if (req.user?.id === userId) {
      res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Cambiar el estado
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { active: !user.active },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
};