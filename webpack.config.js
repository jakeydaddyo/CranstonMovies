const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { AngularCompilerPlugin } = require('@ngtools/webpack');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
        fallback: {
          fs: false,
          path: false
        }
      
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: '@ngtools/webpack'
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new AngularCompilerPlugin({
      tsConfigPath: 'tsconfig.json',
      entryModule: path.resolve(__dirname, 'src/app/app.module#AppModule'),
      sourceMap: true
    })
  ],
  devServer: {
    historyApiFallback: true,
    port: 4200
  }
};
