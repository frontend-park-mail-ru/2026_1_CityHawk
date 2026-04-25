"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const node_path_1 = __importDefault(require("node:path"));
const app = (0, express_1.default)();
const distPath = node_path_1.default.resolve(__dirname, '..', 'dist');
const publicPath = node_path_1.default.resolve(__dirname, '..', 'public');
const FRONTEND_PORT = Number(process.env.PORT || 3000);
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
const YANDEX_MAPS_API_KEY = process.env.YANDEX_MAPS_API_KEY || '';
app.use((0, morgan_1.default)('dev'));
app.use('/public', express_1.default.static(publicPath));
app.get('/runtime-config.js', (_req, res) => {
    res.type('application/javascript');
    res.send(`window.__APP_CONFIG__ = ${JSON.stringify({ API_BASE_URL, YANDEX_MAPS_API_KEY })};`);
});
app.use(express_1.default.static(distPath));
app.use((_req, res) => {
    res.sendFile(node_path_1.default.resolve(distPath, 'index.html'));
});
app.listen(FRONTEND_PORT, () => {
    console.log(`CityHawk server started: http://localhost:${FRONTEND_PORT}`);
});
