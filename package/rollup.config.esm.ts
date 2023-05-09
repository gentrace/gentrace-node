import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: ["index.ts", "openai.ts", "pinecone.ts"],
  output: [
    {
      dir: "dist/esm",
      format: "es",
      sourcemap: true,
      preserveModules: true,
      entryFileNames: "[name].mjs",
    },
  ],
  plugins: [
    json(),
    commonjs(),
    nodeResolve(),
    typescript({
      tsconfig: "./tsconfig.esm.json",
    }),
  ],
};
