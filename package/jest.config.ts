/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  setupFiles: ["dotenv/config"],
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  transformIgnorePatterns: ["node_modules", "dist"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.spec.json",
      },
    ],
  },
};