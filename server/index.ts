import express from 'express';
import morgan from 'morgan';
import path from 'node:path';

const app = express();
const distPath = path.resolve(__dirname, '..', 'dist');
const publicPath = path.resolve(__dirname, '..', 'public');

const FRONTEND_PORT = Number(process.env.PORT || 3000);
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
const YANDEX_MAPS_API_KEY = process.env.YANDEX_MAPS_API_KEY || '';

app.use(morgan('dev'));
app.use('/public', express.static(publicPath));

app.get('/runtime-config.js', (_req, res) => {
  res.type('application/javascript');
  res.send(`window.__APP_CONFIG__ = ${JSON.stringify({ API_BASE_URL, YANDEX_MAPS_API_KEY })};`);
});
app.use(express.static(distPath));

app.use((_req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(FRONTEND_PORT, () => {
  console.log(`CityHawk server started: http://localhost:${FRONTEND_PORT}`);
});
