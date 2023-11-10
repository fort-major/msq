const fs = require("fs");
const dotenv = require("dotenv");
const config = dotenv.config();

let whitelisted = Object.keys(process.env)
  .filter((key) => key.startsWith("MSQ_"))
  .reduce((prev, cur) => ({ ...prev, [`VITE_${cur}`]: JSON.stringify(process.env[cur]) }), {});

whitelisted = Object.keys(config.parsed)
  .filter((key) => key.startsWith("CANISTER_ID_"))
  .map((key) => key.toUpperCase())
  .reduce((prev, cur) => ({ ...prev, [`VITE_${cur}`]: JSON.stringify(config.parsed[cur]) }), whitelisted);

let mode = process.env.MSQ_MODE.toLowerCase();

if (mode !== "dev" && mode !== "prod") {
  throw new Error("Invalid mode:", mode);
}

console.log("Whitelisted env variables:", JSON.stringify(whitelisted, 2));

const envFileName = `.env.${mode === "prod" ? "production" : mode}`;
const newEnv = Object.keys(whitelisted)
  .map((cur) => `${cur}=${whitelisted[cur]}`)
  .join("\n");

fs.writeFileSync(envFileName, newEnv);

console.log("Successfully written whitelisted env variables to", envFileName);
