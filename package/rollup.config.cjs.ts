import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: ["index.ts", "openai.ts", "pinecone.ts"],
  output: [
    {
      dir: "dist",
      format: "cjs",
      preserveModules: true,
      sourcemap: true,
    },
  ],
  plugins: [
    json(),
    commonjs(),
    nodeResolve(),
    typescript({
      tsconfig: "./tsconfig.cjs.json",
    }),
  ],
};
