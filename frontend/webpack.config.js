const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/main.ts',   // <— your TS entry point
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'   // <— this gets included in Play templates
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  devtool: 'source-map'
};
