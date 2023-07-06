/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  rootDir: '.',
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['./src/**/*'],
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  testRegex: '/tests/.+\\.test\\.ts?$',
  verbose: false,
};
