require('dotenv').config({ path: './.env.test' });


module.exports = {
    testEnvironment: 'node',
    setupFiles: ['dotenv/config'],
    setupFilesAfterEnv: ['./tests/jest.setup.js'],
    coveragePathIgnorePatterns: ['/node_modules/'],
  };