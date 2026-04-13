const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const multer = require('multer');

const publicPath = path.resolve(__dirname, 'public');
const uploadsDir = path.resolve(publicPath, 'static', 'img');

fs.mkdirSync(uploadsDir, { recursive: true });

const uploadStorage = multer.diskStorage({
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
  storage: uploadStorage,
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

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: {
    main: './src/main.ts',
    'service-worker': './src/service-worker.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: (pathData) => (
      pathData.chunk && pathData.chunk.name === 'service-worker'
        ? 'service-worker.js'
        : 'bundle.[contenthash].js'
    ),
    clean: true,
    publicPath: '/',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/i,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.ts$/i,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.hbs$/i,
        type: 'asset/source',
      },
    ],
  },
  resolve: {
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      chunks: ['main'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public/static'),
          to: 'public/static',
        },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: publicPath,
    },
    historyApiFallback: true,
    port: 3000,
    setupMiddlewares: (middlewares, devServer) => {
      if (devServer?.app) {
        devServer.app.post('/api/uploads/images', upload.single('file'), (req, res) => {
          if (!req.file) {
            res.status(400).json({ error: 'Файл не был загружен' });
            return;
          }

          const origin = `${req.protocol}://${req.get('host')}`;

          res.status(201).json({
            url: `${origin}/public/static/img/${req.file.filename}`,
          });
        });
      }

      return middlewares;
    },
  },
};
