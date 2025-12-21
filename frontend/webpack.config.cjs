const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',

    entry: './src/main.ts',

    output: {
      filename: isProd ? 'assets/app.[contenthash].js' : 'assets/app.js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
      clean: true
    },

    resolve: {
      extensions: ['.ts', '.js', '.vue'],
      alias: { '@': path.resolve(__dirname, 'src') }
    },

    module: {
      rules: [
        { test: /\.vue$/, loader: 'vue-loader' },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: { appendTsSuffixTo: [/\.vue$/], transpileOnly: true },
          exclude: /node_modules/
        },
        { test: /\.css$/, use: ['style-loader', { loader: 'css-loader', options: { url: true } }] },
        {
          test: /\.s[ac]ss$/i,
          use: [
            'style-loader',
            { loader: 'css-loader', options: { url: true } },
            { loader: 'sass-loader', options: { implementation: require('sass') } }
          ]
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/[name].[contenthash][ext]' }
        }
      ]
    },

    plugins: (() => {
      const plugins = [
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
          __VUE_OPTIONS_API__: JSON.stringify(true),
          __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
        }),
        new HtmlWebpackPlugin({
          template: path.resolve(__dirname, 'public/index.html')
        }),
        new CopyWebpackPlugin({
          patterns: [
            { from: path.resolve(__dirname, 'public/manifest.json'), to: 'manifest.json' },
            { from: path.resolve(__dirname, 'public/icons'), to: 'icons' }
          ]
        })
      ];

      if (isProd) {
        plugins.push(
          new GenerateSW({
            clientsClaim: true,
            skipWaiting: true,
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api\//]
          })
        );
      }

      return plugins;
    })(),


    devtool: isProd ? false : 'source-map',

    devServer: {
      port: 8081,
      historyApiFallback: true,
      hot: true,

      static: {
        directory: path.resolve(__dirname, 'public'),
        publicPath: '/',
        watch: true
      },

      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:9000',
          changeOrigin: true,
          ws: true,

          cookieDomainRewrite: 'localhost',
          cookiePathRewrite: '/'
        }
      ]
    }
  };
};
