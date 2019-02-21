const path = require('path');

  module.exports = {
    mode: 'development',
    target: 'web',
    node: {
      fs: 'empty',
      //canvas: false
    },
    externals: {
      canvas: 'canvas'
    },
    entry: './src/index.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist')
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: [
            {
              loader: 'file-loader'
            },
          ],
        }
      ]
   },
   resolve: {
        alias: {
            d3: 'd3/build/d3.js'
        }
    },
    devtool: 'inline-source-map',
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      //compress: true,
      port: 9000
    }
}