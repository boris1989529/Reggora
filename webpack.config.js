var webpack = require('webpack');
var path = require('path');
var libraryName = 'reggoraSketch';
var outputFile = 'bundle.js';

var config = {
  entry: __dirname + '/dist/reggoraSketch.js',
  devtool: 'source-map',
  output: {
    path: __dirname + '/lib',
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    loaders: [
      {
        test: /(\.js)$/,
        loader: 'babel',
        exclude: /(node_modules)/,
        query: {
          cacheDirectory: true,
          presets: ['es2015']
        }
      }
    ]
  },
  resolve: {
    root: path.resolve('./dist'),
    extensions: ['', '.js']
  }
};

module.exports = config;