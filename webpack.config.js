const path = require('path');
const zlib = require('zlib');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

const publicPath = path.resolve(__dirname, 'public');

/** @type {import('webpack').Configuration} */
module.exports = (_, argv = {}) => {
  const isProduction = argv.mode === 'production';

  return {
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
    chunkFilename: '[id].[contenthash].js',
    clean: true,
    publicPath: '/',
  },
  devtool: isProduction ? false : 'source-map',
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
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
        ],
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
    ...(isProduction
      ? [
        new MiniCssExtractPlugin({
          filename: 'styles.[contenthash].css',
          chunkFilename: '[id].[contenthash].css',
        }),
      ]
      : []),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public/static'),
          to: 'public/static',
          globOptions: {
            ignore: ['**/.DS_Store'],
          },
        },
        {
          from: path.resolve(__dirname, 'public/runtime-config.js'),
          to: 'runtime-config.js',
        },
        {
          from: path.resolve(__dirname, 'public/manifest.webmanifest'),
          to: 'manifest.webmanifest',
        },
      ],
    }),
    ...(isProduction
      ? [
        new CompressionPlugin({
          filename: '[path][base].gz',
          algorithm: 'gzip',
          test: /\.(js|css|html|svg|json)$/i,
          threshold: 10240,
          minRatio: 0.8,
        }),
        new CompressionPlugin({
          filename: '[path][base].br',
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg|json)$/i,
          compressionOptions: {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            },
          },
          threshold: 10240,
          minRatio: 0.8,
        }),
      ]
      : []),
  ],
  optimization: {
    minimize: isProduction,
    minimizer: isProduction
      ? [
        '...',
        new CssMinimizerPlugin(),
        new ImageMinimizerPlugin({
          minimizer: {
            implementation: ImageMinimizerPlugin.sharpMinify,
            options: {
              encodeOptions: {
                jpeg: {
                  quality: 82,
                  mozjpeg: true,
                },
                png: {
                  quality: 82,
                  compressionLevel: 9,
                  palette: true,
                },
                webp: {
                  quality: 82,
                },
              },
            },
          },
        }),
      ]
      : undefined,
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  performance: {
    hints: 'warning',
    maxAssetSize: 1024 * 1024,
    maxEntrypointSize: 1024 * 1024,
    assetFilter: (assetFilename) => (
      !assetFilename.includes('public/static/img/')
      && !assetFilename.endsWith('.DS_Store')
      && !assetFilename.endsWith('.map')
    ),
  },
  devServer: {
    static: {
      directory: publicPath,
    },
    historyApiFallback: true,
    port: 8000,
  },
  };
};
