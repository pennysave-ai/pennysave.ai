import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@auth/core|next-auth|jose|@panva|oauth|preact|@babel/runtime)/.*)",
  ],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  testEnvironmentOptions: {
    url: "http://localhost:3000",
  },
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text", "clover"],
};

export default createJestConfig(config);
