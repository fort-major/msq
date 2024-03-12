const tsPreset = require("ts-jest/jest-preset");
const snapPreset = require("@metamask/snaps-jest/jest-preset");

module.exports = {
  ...tsPreset,
  ...snapPreset,
};
