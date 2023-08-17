/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  setupFiles: ["dotenv/config"],
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  testPathIgnorePatterns: ["node_modules", "dist"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.spec.json",
      },
    ],
    "^.+\\.js$": "babel-jest",
  },
};
