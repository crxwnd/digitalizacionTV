"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        res.status(401).json({ error: 'No autorizado - Token no proporcionado' });
        return;
    }
    const decoded = (0, jwt_1.verifyToken)(token);
    if (!decoded) {
        res.status(401).json({ error: 'No autorizado - Token inválido' });
        return;
    }
    req.user = decoded;
    next();
};
exports.authenticate = authenticate;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'No tienes permisos para esta acción' });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
