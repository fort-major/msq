const { readFileSync, writeFileSync } = require("fs");

const sharedVersion = JSON.parse(readFileSync("../shared/package.json", { encoding: "utf-8" })).version;
const packangeJson = JSON.parse(readFileSync("./package.json", { encoding: "utf-8" }));

packangeJson.dependencies["@fort-major/msq-shared"] = sharedVersion;

writeFileSync("./package.json", JSON.stringify(packangeJson, undefined, 2));
