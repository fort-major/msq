const fs = require("fs");

let fileEsm = fs.readFileSync("dist/esm/index.js", "utf8");
let fileCjs = fs.readFileSync("dist/cjs/index.js", "utf8");

for (let v of Object.keys(process.env)) {
  if (!v.startsWith("MSQ_")) continue;

  fileEsm = fileEsm.replace(`process.env.${v}`, `"${process.env[v]}"`);
  fileCjs = fileCjs.replace(`process.env.${v}`, `"${process.env[v]}"`);
}

fs.writeFileSync("dist/esm/index.js", fileEsm);
fs.writeFileSync("dist/cjs/index.js", fileCjs);

console.log("Env variables inlined into client");
