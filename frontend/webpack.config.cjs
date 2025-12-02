const path = require('path');

module.exports = {
  mode: 'development',              // 'production' later for release
  entry: './src/main.ts',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, '../public/javascripts'),
    publicPath: '/assets/javascripts/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'], 
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
