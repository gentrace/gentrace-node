import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: ["dist/index.js", "dist/openai.js", "dist/pinecone.js"],
  output: [
    {
      dir: "dist",
      format: "cjs",
      preserveModules: true,
      sourcemap: true,
    },
    {
      dir: "dist",
      format: "es",
      sourcemap: true,
      preserveModules: true,
      entryFileNames: "[name].mjs",
    },
  ],
  external: ["@pinecone-database/pinecone", "openai"],
  plugins: [json(), commonjs()],
};
