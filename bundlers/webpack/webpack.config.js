const path = require("path");
module.exports = {
  target: "node",
  entry: "./index.js",
  output: {
    filename: "out.js",
    path: path.resolve(__dirname, "dist"),
  },
  mode: "production",
  externals: {
    "@pinecone-database/pinecone": {
      root: "@pinecone-database/pinecone",
    },
  },
};
