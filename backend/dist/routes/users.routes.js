"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("../controllers/users.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Solo Admin puede gestionar usuarios
router.use(auth_1.authenticate, (0, auth_1.authorizeRoles)('ADMIN'));
router.get('/', users_controller_1.getUsers);
router.post('/', users_controller_1.createUser);
router.put('/:id', users_controller_1.updateUser);
router.delete('/:id', users_controller_1.deleteUser);
exports.default = router;
