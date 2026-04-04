/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',

  // Run @testing-library/jest-dom matchers (toBeInTheDocument etc.) for every test
  setupFilesAfterFramework: ['@testing-library/jest-dom'],

  // Transpile JS/JSX via babel.config.js
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Redirect bare SilverStripe module aliases that webpack resolves at build time
  moduleNameMapper: {
    // lib/Injector is provided by silverstripe/admin at runtime
    '^lib/Injector$': '<rootDir>/client/src/__mocks__/Injector.js',
    // CSS/SCSS imports are irrelevant in tests
    '\\.(css|scss)$': '<rootDir>/client/src/__mocks__/fileMock.js',
  },

  testMatch: ['**/client/src/**/__tests__/**/*.test.js'],

  collectCoverageFrom: [
    'client/src/**/*.js',
    '!client/src/bundles/**',
    '!client/src/__mocks__/**',
  ],
};
