module.exports = {
  preset: "ts-jest",
  testEnvironment: "@metamask/snaps-jest",
  setupFilesAfterEnv: ["@metamask/snaps-jest/dist/cjs/setup.js"],
  testTimeout: 20000,
};
