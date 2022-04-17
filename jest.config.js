module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    'jest-extended'
  ],
  coveragePathIgnorePatterns: [],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1'
  }
};
