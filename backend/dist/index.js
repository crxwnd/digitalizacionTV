"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Importar rutas
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const areas_routes_1 = __importDefault(require("./routes/areas.routes"));
const screens_routes_1 = __importDefault(require("./routes/screens.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middlewares
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Rutas
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Backend funcionando correctamente' });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/areas', areas_routes_1.default);
app.use('/api/screens', screens_routes_1.default);
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend escuchando en puerto ${PORT}`);
});
