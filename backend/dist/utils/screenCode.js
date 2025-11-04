"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateScreenCode = void 0;
// Generar código único para pantallas
const generateScreenCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SCR-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
exports.generateScreenCode = generateScreenCode;
