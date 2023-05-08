import typescript from "@rollup/plugin-typescript";

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
    typescript({
      tsconfig: "./tsconfig.esm.json",
    }),
  ],
};
