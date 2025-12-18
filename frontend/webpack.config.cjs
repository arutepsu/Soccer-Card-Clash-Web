const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProd ? 'production' : 'development',

  entry: './src/main.ts',

  output: {
    filename: isProd ? 'assets/app.[contenthash].js' : 'assets/app.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',                 // IMPORTANT
    assetModuleFilename: 'assets/[name].[contenthash][ext][query]',
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

      { test: /\.css$/, use: ['style-loader', { loader: 'css-loader', options: { url: true } }] },

      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { url: true } },
          { loader: 'sass-loader', options: { implementation: require('sass') } },
        ],
      },

      { test: /\.(png|jpe?g|gif|svg)$/i, type: 'asset/resource' },
    ],
  },

  plugins: [
    new VueLoaderPlugin(),

    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      scriptLoading: 'module',
    }),

    new CopyWebpackPlugin({
      patterns: [
        // copy everything in public EXCEPT index.html (HtmlWebpackPlugin handles it)
        { from: path.resolve(__dirname, 'public'), to: '.', globOptions: { ignore: ['**/index.html'] } },
      ],
    }),

    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: JSON.stringify(true),
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
    }),
  ],

  devServer: {
    port: 8080,
    historyApiFallback: true,
    hot: true,

    proxy: {
      '/api': { target: 'http://localhost:9000', changeOrigin: true, ws: true },
      '/login': { target: 'http://localhost:9000', changeOrigin: true },
      '/logout': { target: 'http://localhost:9000', changeOrigin: true },
    },
  },
};