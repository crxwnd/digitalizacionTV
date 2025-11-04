"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const areas_controller_1 = require("../controllers/areas.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todos los usuarios autenticados pueden ver áreas
router.get('/', auth_1.authenticate, areas_controller_1.getAreas);
// Solo Admin puede crear/editar/eliminar áreas
router.post('/', auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'), areas_controller_1.createArea);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'), areas_controller_1.updateArea);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'), areas_controller_1.deleteArea);
exports.default = router;
