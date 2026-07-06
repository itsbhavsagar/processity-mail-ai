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
  // Never scan build output — the standalone bundle contains its own
  // package.json/node_modules and triggers Jest haste-map collisions.
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  clearMocks: true,
};

module.exports = createJestConfig(customJestConfig);
