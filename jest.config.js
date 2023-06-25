/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
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
  // moduleNameMapper: {
  //   '../src(.*)': '<rootDir>/src$1'
  // }
};
