const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    assetModuleFilename: 'images/[name][ext]', 
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // دعم jsx
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: { // إضافة هذه الجزئية
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  mode: 'production',
  devServer: {
    compress: true,
    port: 8887,
    open: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'lib'),
    },
    client: {
      logging: 'error'
    },
  },
  stats: 'errors-warnings',
};
