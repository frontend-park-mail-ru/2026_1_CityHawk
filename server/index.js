'use strict'

const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();

const FRONTEND_PORT = Number(process.env.PORT || 3000);

app.use(morgan('dev'));
app.use('/public', express.static(path.resolve(__dirname, '..', 'public')));
app.use('/src', express.static(path.resolve(__dirname, '..', 'src')));

app.use((_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
});

app.listen(FRONTEND_PORT, () => {
  console.log(`CityHawk server started: http://localhost:${FRONTEND_PORT}`);
});
