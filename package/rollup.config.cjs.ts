import typescript from "@rollup/plugin-typescript";

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
    typescript({
      tsconfig: "./tsconfig.cjs.json",
    }),
  ],
};
