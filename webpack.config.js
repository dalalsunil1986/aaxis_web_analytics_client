var plugins = [],
webpack = require("webpack"),
glob = require("glob"),
minimize = process.argv.indexOf('--minimize') !== -1;

if (minimize) {
  plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = {
  devtool: 'inline-source-map',
  entry: {
    test: glob.sync("./lib/tests/*spec.js"),
    build: [
       './lib/aaxis_tag_manager.js',
      './lib/aws_kinesis.js',
      './config/config.js',
      './lib/app.js'
    ]
  },
  output: {
    filename: '[name].js',
    publicPath: '/'
  },
  plugins: plugins
};