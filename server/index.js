'use strict'

const cookieParser = require('cookie-parser');
const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();

const FRONTEND_PORT = Number(process.env.PORT || 3000);
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080';

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/public', express.static(path.resolve(__dirname, '..', 'public')));
app.use('/src', express.static(path.resolve(__dirname, '..', 'src')));

function joinCookieHeader(cookies) {
  if (!cookies || typeof cookies !== 'object') {
    return '';
  }

  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

async function proxyToBackend(req, res, backendPath) {
  const headers = new Headers();

  if (req.headers['content-type']) {
    headers.set('Content-Type', req.headers['content-type']);
  }

  const cookieHeader = joinCookieHeader(req.cookies);
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  const method = req.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);

  const backendResponse = await fetch(`${BACKEND_BASE_URL}${backendPath}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
  });

  const setCookie = backendResponse.headers.get('set-cookie');
  if (setCookie) {
    res.setHeader('set-cookie', setCookie);
  }

  const responseText = await backendResponse.text();
  res.status(backendResponse.status);

  const contentType = backendResponse.headers.get('content-type');
  if (contentType) {
    res.setHeader('content-type', contentType);
  }

  res.send(responseText);
}

app.post('/auth/register', async (req, res) => {
  await proxyToBackend(req, res, '/auth/register');
});

app.post('/auth/login', async (req, res) => {
  await proxyToBackend(req, res, '/auth/login');
});

app.post('/auth/refresh', async (req, res) => {
  await proxyToBackend(req, res, '/auth/refresh');
});

app.post('/auth/logout', async (req, res) => {
  await proxyToBackend(req, res, '/auth/logout');
});

app.get('/me', async (req, res) => {
  await proxyToBackend(req, res, '/me');
});

app.get('/health', async (req, res) => {
  await proxyToBackend(req, res, '/health');
});

app.use((_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
});

app.listen(FRONTEND_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CityHawk server started: http://localhost:${FRONTEND_PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Backend target: ${BACKEND_BASE_URL}`);
});
