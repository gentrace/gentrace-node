import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.msw.setup.ts'],
  // Uncomment the SWC transform
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { sourceMaps: 'inline' }],
  },
  // Ensure packages like superjson and yoctocolors are transformed
  transformIgnorePatterns: ['/node_modules/(?!(superjson|yoctocolors)/.*)'],
  // ts-jest will handle transformation via the preset
  moduleNameMapper: {
    '^gentrace$': '<rootDir>/src/index.ts',
    '^gentrace/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/ecosystem-tests/',
    '<rootDir>/dist/',
    '<rootDir>/deno/',
    '<rootDir>/deno_tests/',
    '<rootDir>/packages/',
  ],
  testPathIgnorePatterns: ['scripts'],
};

export default config;
