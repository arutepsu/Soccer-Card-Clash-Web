const path = require('path');
const fs = require('fs');
const { VueLoaderPlugin } = require('vue-loader');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

function findHashedAsset(outDir, prefix, ext = '.jpg') {
  const assetsDir = path.join(outDir, 'assets');
  if (!fs.existsSync(assetsDir)) return null;

  return fs
    .readdirSync(assetsDir)
    .find((f) => f.startsWith(prefix) && f.endsWith(ext)) || null;
}

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const outDir = path.resolve(__dirname, 'dist');

  const MiniCssExtractPlugin = require('mini-css-extract-plugin');

  const styleUse = isProd ? MiniCssExtractPlugin.loader : 'style-loader';

  const background = isProd
    ? findHashedAsset(outDir, 'background5.')
    : null;

  return {
    mode: isProd ? 'production' : 'development',

    entry: './src/main.ts',

    output: {
      filename: isProd ? 'assets/app.[contenthash].js' : 'assets/app.js',
      path: outDir,
      publicPath: '/web/',
      clean: true,
    },

    resolve: {
      extensions: ['.ts', '.js', '.vue'],
      alias: { '@': path.resolve(__dirname, 'src') },
    },

    module: {
      rules: [
        { test: /\.vue$/, loader: 'vue-loader' },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: { appendTsSuffixTo: [/\.vue$/], transpileOnly: true },
          exclude: /node_modules/,
        },
        { test: /\.css$/, use: [styleUse, 'css-loader'] },
        { test: /\.s[ac]ss$/, use: [styleUse, 'css-loader', 'sass-loader'] },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/[name].[contenthash][ext]' },
        },
        {
          test: /\.(wav|mp3|ogg)$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/sounds/[name].[contenthash][ext]' },
        },
      ],
    },

    plugins: [
      new VueLoaderPlugin(),

      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
      }),

      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
        filename: 'index.html',
        inject: 'body',
      }),

      new CopyWebpackPlugin({
        patterns: [
          { from: 'public/manifest.json', to: 'manifest.json' },
          { from: 'public/icons', to: 'icons' },
        ],
      }),

      ...(isProd
        ? [
            new MiniCssExtractPlugin({
              filename: 'assets/[name].[contenthash].css',
              chunkFilename: 'assets/[name].[contenthash].css',
            }),
            new GenerateSW({
              clientsClaim: true,
              skipWaiting: true,
              swDest: 'service-worker.js',
              navigateFallback: '/web/index.html',
              navigateFallbackDenylist: [/^\/api\//],
              runtimeCaching: [
                {
                  urlPattern: ({ request }) =>
                    request.destination === 'image',
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'images',
                    expiration: {
                      maxEntries: 200,
                      maxAgeSeconds: 60 * 24 * 60 * 60,
                    },
                  },
                },
                {
                  urlPattern: ({ request }) =>
                    request.destination === 'audio',
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'audio',
                    expiration: {
                      maxEntries: 50,
                      maxAgeSeconds: 30 * 24 * 60 * 60,
                    },
                  },
                },
              ],
            }),
          ]
        : []),
        new webpack.DefinePlugin({
          __VUE_OPTIONS_API__: JSON.stringify(true),
          __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
          'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
          'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
        }),
    ],

    devtool: isProd ? false : 'source-map',

    devServer: {
      port: 8081,
      hot: true,

      historyApiFallback: {
        index: '/web/index.html',
      },

      static: {
        directory: path.resolve(__dirname, '../backend/public'),
        publicPath: '/',
        watch: true,
      },

      proxy: [
      // Normal HTTP API calls
      {
        context: ['/api'],
        target: 'http://localhost:9000',
        changeOrigin: true,
        ws: false, // <-- IMPORTANT: don't try to upgrade random /api calls
        onProxyReq: (proxyReq, req) => {
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
          }
          if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
          }
        },
      },

      // WebSocket only for the WS endpoint
      {
        context: ['/api/ws'],
        target: 'ws://localhost:9000',
        changeOrigin: true,
        ws: true,
        onProxyReqWs: (proxyReq, req) => {
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
          }
          if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
          }
        },
      },
    ],

    },
  };
};
