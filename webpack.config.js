module.exports = {
  entry: "./javascript/index.js",
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  module: {
    loaders: []
  }
};
