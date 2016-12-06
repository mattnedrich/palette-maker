module.exports = {
  entry: "./javascript/app.js",
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  module: {
    loaders: []
  }
};
