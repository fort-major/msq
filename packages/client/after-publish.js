const { readFileSync, writeFileSync } = require("fs");

const packangeJson = JSON.parse(readFileSync("./package.json", { encoding: "utf-8" }));

packangeJson.dependencies["@fort-major/msq-shared"] = "workspace:*";

writeFileSync("./package.json", JSON.stringify(packangeJson, undefined, 2));
