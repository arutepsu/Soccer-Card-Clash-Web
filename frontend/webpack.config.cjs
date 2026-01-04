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
  return fs.readdirSync(assetsDir).find((f) => f.startsWith(prefix) && f.endsWith(ext)) || null;
}

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const enableSwInDev = env?.SW === true || env?.SW === 'true';
  const enableSW = isProd || enableSwInDev;

  const outDir = path.resolve(__dirname, 'dist');

  const swExcludeProd = [/\.map$/i, /hot-update\.js$/i, /hot-update\.json$/i];

  const swExcludeDev = [
    ...swExcludeProd,
    /assets\/.*\.(png|jpe?g|gif|svg)$/i,
    /assets\/sounds\/.*\.(mp3|wav|ogg)$/i,
    /\.(ttf|woff2?|eot|otf)$/i,
    /assets\/app\.js$/i,
    /assets\/app\..*\.js$/i,
  ];

  const MiniCssExtractPlugin = require('mini-css-extract-plugin');
  const styleUse = isProd ? MiniCssExtractPlugin.loader : 'style-loader';

  const background = isProd ? findHashedAsset(outDir, 'background5.') : null;

  return {
    mode: isProd ? 'production' : 'development',
    entry: './src/main.ts',

    output: {
      filename: isProd ? 'assets/app.[contenthash].js' : 'assets/app.js',
      path: outDir,
      publicPath: '/',
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
      ],
    },

    plugins: [
      new VueLoaderPlugin(),

      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
        filename: 'index.html',
        inject: 'body',
      }),

      new CopyWebpackPlugin({
        patterns: [
          { from: 'public/manifest.json', to: 'manifest.json' },
          { from: 'public/icons', to: 'icons' },
          { from: 'src/assets/sounds', to: 'assets/sounds' },
        ],
      }),

      ...(isProd
        ? [
            new MiniCssExtractPlugin({
              filename: 'assets/[name].[contenthash].css',
              chunkFilename: 'assets/[name].[contenthash].css',
            }),
          ]
        : []),

      ...(enableSW
        ? [
            new GenerateSW({
              clientsClaim: isProd,
              skipWaiting: isProd,
              cleanupOutdatedCaches: true,

              swDest: 'service-worker.js',

              navigateFallback: '/index.html',
              navigateFallbackDenylist: [/^\/api\//],

              exclude: isProd ? swExcludeProd : swExcludeDev,
              maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,

              runtimeCaching: [
                {
                  urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
                  handler: 'NetworkOnly',
                },
                {
                  urlPattern: ({ url }) =>
                    url.pathname.startsWith('/assets/') &&
                    /\.(png|jpe?g|gif|svg)$/i.test(url.pathname),
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'images',
                    expiration: { maxEntries: 2000, maxAgeSeconds: 30 * 24 * 60 * 60 },
                  },
                },
                {
                  urlPattern: ({ url }) =>
                    (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/')) &&
                    /\.(ttf|woff2?|eot|otf)$/i.test(url.pathname),
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'fonts',
                    expiration: { maxEntries: 100, maxAgeSeconds: 365 * 24 * 60 * 60 },
                  },
                },
                {
                  urlPattern: ({ url }) =>
                    url.pathname.startsWith('/assets/sounds/') &&
                    /\.(mp3|wav|ogg)$/i.test(url.pathname),
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'audio',
                    expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
                  },
                },
              ],
            }),

            ...(enableSwInDev
              ? [
                  new CopyWebpackPlugin({
                    patterns: [
                      {
                        from: path.resolve(outDir, 'service-worker.js'),
                        to: path.resolve(__dirname, '../backend/public/service-worker.js'),
                        noErrorOnMissing: true,
                      },
                    ],
                  }),
                ]
              : []),
          ]
        : []),

      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
        'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
      }),
    ],

    devtool: isProd ? false : 'source-map',

    devServer: {
      port: 8080,
      hot: true,

      historyApiFallback: { index: '/index.html' },

      devMiddleware: {
        publicPath: '/',
        writeToDisk: (filePath) => /service-worker\.js$/.test(filePath),
      },

      static: {
        directory: path.resolve(__dirname, '../backend/public'),
        publicPath: '/',
        watch: true,
      },

      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:9000',
          changeOrigin: true,
          ws: true,
          secure: false,
          logLevel: 'debug',
        },
      ],
    },
  };
};
