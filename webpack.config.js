module.exports = {
  entry: "./javascript/app.js",
  output: {
    path: __dirname,
    filename: "./public/javascript/bundle.js"
  },
  module: {
    loaders: []
  }
};
