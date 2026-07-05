const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Load next.config and .env files into the test environment.
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // Pure business-logic units — no DOM needed, so the faster node env is correct.
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  clearMocks: true,
};

module.exports = createJestConfig(customJestConfig);
