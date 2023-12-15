const fs = require("fs");
const files = ["index.js", "icrc35-client.js"];

for (let file of files) {
  let fileEsm = fs.readFileSync(`dist/esm/${file}`, "utf8");
  let fileCjs = fs.readFileSync(`dist/cjs/${file}`, "utf8");

  for (let v of Object.keys(process.env)) {
    if (!v.startsWith("MSQ_")) continue;

    fileEsm = fileEsm.replace(`process.env.${v}`, `"${process.env[v]}"`);
    fileCjs = fileCjs.replace(`process.env.${v}`, `"${process.env[v]}"`);
  }

  fs.writeFileSync(`dist/esm/${file}`, fileEsm);
  fs.writeFileSync(`dist/cjs/${file}`, fileCjs);
}

console.log("Env variables inlined into client");
