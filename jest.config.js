module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.mjs'],
  collectCoverageFrom: [
    'src/**/*.ts',
  ],
  preset: 'ts-jest',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@babel)/)',
  ]
};
