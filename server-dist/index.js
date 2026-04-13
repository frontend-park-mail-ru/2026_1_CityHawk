"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
const distPath = node_path_1.default.resolve(__dirname, '..', 'dist');
const publicPath = node_path_1.default.resolve(__dirname, '..', 'public');
const uploadsDir = node_path_1.default.resolve(publicPath, 'static', 'img');
node_fs_1.default.mkdirSync(uploadsDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, uploadsDir);
    },
    filename: (_req, file, callback) => {
        const ext = node_path_1.default.extname(file.originalname || '').toLowerCase();
        const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext) ? ext : '.jpg';
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        callback(null, `upload-${uniqueSuffix}${safeExt}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
            callback(new Error('Можно загружать только изображения'));
            return;
        }
        callback(null, true);
    },
});
const FRONTEND_PORT = Number(process.env.PORT || 3000);
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
app.use((0, morgan_1.default)('dev'));
app.use('/public', express_1.default.static(publicPath));
app.post('/api/uploads/images', upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'Файл не был загружен' });
        return;
    }
    const origin = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({
        url: `${origin}/public/static/img/${req.file.filename}`,
    });
});
app.get('/runtime-config.js', (_req, res) => {
    res.type('application/javascript');
    res.send(`window.__APP_CONFIG__ = ${JSON.stringify({ API_BASE_URL })};`);
});
app.use(express_1.default.static(distPath));
app.use((_req, res) => {
    res.sendFile(node_path_1.default.resolve(distPath, 'index.html'));
});
app.listen(FRONTEND_PORT, () => {
    console.log(`CityHawk server started: http://localhost:${FRONTEND_PORT}`);
});
