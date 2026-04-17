const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const publicPath = path.resolve(__dirname, 'public');

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
    chunkFilename: '[id].[contenthash].js',
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
          globOptions: {
            ignore: ['**/.DS_Store'],
          },
        },
      ],
    }),
  ],
  optimization: {
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
    maxAssetSize: 700 * 1024,
    maxEntrypointSize: 700 * 1024,
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
    port: 3000,
  },
};
