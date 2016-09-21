var plugins = [],
webpack = require("webpack");

plugins.push(new webpack.optimize.UglifyJsPlugin());

module.exports = {
  entry: {
    build: [
       './lib/aaxis_tag_manager.js',
      './lib/aws_kinesis.js',
      './config/config.js',
      './lib/app.js'
    ]
  },
  output: {
    filename: "build.js"
  },
  plugins: plugins
};