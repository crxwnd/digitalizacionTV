"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteArea = exports.updateArea = exports.createArea = exports.getAreas = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAreas = async (req, res) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.id;
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
                    screens: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        }
        else {
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
                    screens: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        }
        res.json(areas);
    }
    catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.getAreas = getAreas;
const createArea = async (req, res) => {
    try {
        const { name, description, managerId } = req.body;
        if (!name || !managerId) {
            res.status(400).json({ error: 'Nombre y responsable son requeridos' });
            return;
        }
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
    }
    catch (error) {
        console.error('Error al crear área:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.createArea = createArea;
const updateArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, managerId } = req.body;
        const area = await prisma.area.update({
            where: { id: parseInt(id) },
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
        res.json(area);
    }
    catch (error) {
        console.error('Error al actualizar área:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.updateArea = updateArea;
const deleteArea = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.area.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Área eliminada correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar área:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.deleteArea = deleteArea;
