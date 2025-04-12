/** @type {import('jest').Config} */
export default {
  // Explicitly enable Babel transformation for JS/JSX files
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  // transform: {},
  testEnvironment: 'node',
  // extensionsToTreatAsEsm: ['.js'], // Removed: Redundant with "type": "module" in package.json
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  testTimeout: 30000
};
