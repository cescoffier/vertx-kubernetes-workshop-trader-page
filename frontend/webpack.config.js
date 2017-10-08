var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: './src/entry.js',
  output: {
    path: path.resolve(__dirname, './dist/consoleroot/js'),
    publicPath: '/dist/consoleroot/js',
    filename: 'trader.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['react', 'es2015', 'react-hmre', 'stage-2'],
          plugins: ['transform-class-properties']
        }
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.css$/,
        loader: 'css-loader'
      }
    ]
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
    proxy: {
      '/admin/trader': {
        target: 'http://localhost:5000',
        secure: false,
        ws: true
      }
    }
  },
  performance: {
    hints: false
  }
  // devtool: '#eval-source-map'
}

// if (process.env.NODE_ENV === 'production') {
//   // module.exports.devtool = '#source-map'
//   // http://vue-loader.vuejs.org/en/workflow/production.html
//   module.exports.plugins = (module.exports.plugins || []).concat([
//     new webpack.DefinePlugin({
//       'process.env': {
//         NODE_ENV: '"production"'
//       }
//     }),
//     new webpack.optimize.UglifyJsPlugin({
//       // sourceMap: true,
//       compress: {
//         warnings: false
//       }
//     }),
//     new webpack.LoaderOptionsPlugin({
//       minimize: true
//     })
//   ])
// }
