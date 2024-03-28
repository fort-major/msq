const tsPreset = require("ts-jest/jest-preset");
const mmPreset = require("@metamask/snaps-jest/jest-preset");

module.exports = {
  ...tsPreset,
  ...mmPreset,
};
