import express from 'express';
import morgan from 'morgan';
import path from 'node:path';

const app = express();
const distPath = path.resolve(__dirname, '..', 'dist');

const FRONTEND_PORT = Number(process.env.PORT || 3000);
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

app.use(morgan('dev'));
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
