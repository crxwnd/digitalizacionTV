"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const client_1 = require("@prisma/client");
const password_1 = require("../utils/password");
const prisma = new client_1.PrismaClient();
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
                createdAt: true,
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
    }
    catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res) => {
    try {
        const { email, name, password, role } = req.body;
        if (!email || !name || !password || !role) {
            res.status(400).json({ error: 'Todos los campos son requeridos' });
            return;
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'El email ya está registrado' });
            return;
        }
        const hashedPassword = await (0, password_1.hashPassword)(password);
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role,
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
    }
    catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, name, role, active, password } = req.body;
        const updateData = {};
        if (email)
            updateData.email = email;
        if (name)
            updateData.name = name;
        if (role)
            updateData.role = role;
        if (typeof active === 'boolean')
            updateData.active = active;
        if (password)
            updateData.password = await (0, password_1.hashPassword)(password);
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json(user);
    }
    catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Usuario eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.deleteUser = deleteUser;
