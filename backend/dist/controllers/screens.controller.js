"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.heartbeat = exports.approveScreen = exports.deleteScreen = exports.updateScreen = exports.createScreen = exports.getScreens = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Generar código único para pantallas
const generateScreenCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SCR-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
const getScreens = async (req, res) => {
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
        }
        else {
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
    }
    catch (error) {
        console.error('Error al obtener pantallas:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.getScreens = getScreens;
const createScreen = async (req, res) => {
    try {
        const { name, ip, areaId } = req.body;
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
        // Verificar si la IP ya está en uso
        if (ip) {
            const existingScreen = await prisma.screen.findUnique({
                where: { ip },
            });
            if (existingScreen) {
                res.status(400).json({ error: 'La IP ya está en uso' });
                return;
            }
        }
        // Generar código único
        let code = generateScreenCode();
        let codeExists = await prisma.screen.findUnique({ where: { code } });
        while (codeExists) {
            code = generateScreenCode();
            codeExists = await prisma.screen.findUnique({ where: { code } });
        }
        const screen = await prisma.screen.create({
            data: {
                name,
                code,
                ip,
                areaId,
                approved: false, // Requiere aprobación del admin
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
    }
    catch (error) {
        console.error('Error al crear pantalla:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.createScreen = createScreen;
const updateScreen = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ip, areaId, approved } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (ip)
            updateData.ip = ip;
        if (areaId)
            updateData.areaId = areaId;
        if (typeof approved === 'boolean')
            updateData.approved = approved;
        const screen = await prisma.screen.update({
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
        res.json(screen);
    }
    catch (error) {
        console.error('Error al actualizar pantalla:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.updateScreen = updateScreen;
const deleteScreen = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.screen.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Pantalla eliminada correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar pantalla:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.deleteScreen = deleteScreen;
const approveScreen = async (req, res) => {
    try {
        const { id } = req.params;
        const screen = await prisma.screen.update({
            where: { id: parseInt(id) },
            data: { approved: true },
            include: {
                area: true,
            },
        });
        res.json(screen);
    }
    catch (error) {
        console.error('Error al aprobar pantalla:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.approveScreen = approveScreen;
const heartbeat = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            res.status(400).json({ error: 'Código de pantalla requerido' });
            return;
        }
        const screen = await prisma.screen.update({
            where: { code },
            data: {
                online: true,
                lastHeartbeat: new Date(),
            },
        });
        res.json({ message: 'Heartbeat registrado', screen });
    }
    catch (error) {
        console.error('Error en heartbeat:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
exports.heartbeat = heartbeat;
