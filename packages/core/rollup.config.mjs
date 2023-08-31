import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";

export default {
  input: ["index.ts"],
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
  plugins: [
    typescript({
      include: ["./**/*.ts", "./**/*.js"],
    }),
    copy({
      targets: [{ src: "axios-unsafe-lib", dest: "dist/" }],
    }),
    json(),
    commonjs(),
  ],
};
