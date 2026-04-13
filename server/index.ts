import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';

const app = express();
const distPath = path.resolve(__dirname, '..', 'dist');
const publicPath = path.resolve(__dirname, '..', 'public');
const uploadsDir = path.resolve(publicPath, 'static', 'img');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext) ? ext : '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `upload-${uniqueSuffix}${safeExt}`);
  },
});

const upload = multer({
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

app.use(morgan('dev'));
app.use('/public', express.static(publicPath));

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
app.use(express.static(distPath));

app.use((_req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(FRONTEND_PORT, () => {
  console.log(`CityHawk server started: http://localhost:${FRONTEND_PORT}`);
});
