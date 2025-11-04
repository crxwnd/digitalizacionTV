"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const screens_controller_1 = require("../controllers/screens.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Heartbeat público (para las pantallas)
router.post('/heartbeat', screens_controller_1.heartbeat);
// Rutas protegidas
router.get('/', auth_1.authenticate, screens_controller_1.getScreens);
router.post('/', auth_1.authenticate, screens_controller_1.createScreen);
router.put('/:id', auth_1.authenticate, screens_controller_1.updateScreen);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'), screens_controller_1.deleteScreen);
// Solo Admin puede aprobar pantallas
router.patch('/:id/approve', auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'), screens_controller_1.approveScreen);
exports.default = router;
