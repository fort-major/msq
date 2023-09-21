const fs = require('fs');
const dotenv = require('dotenv');
const config = dotenv.config();

const whitelisted = Object.keys(config.parsed)
    .filter(key => key.startsWith('CANISTER_ID_') || key.startsWith('TURBO_'))
    .map(key => key.toUpperCase())
    .reduce((prev, cur) => ({ ...prev, [`VITE_${cur}`]: JSON.stringify(config.parsed[cur]) }), {});

let mode = process.argv[2];

if (!mode) {
    mode = 'dev';
}

if (mode !== 'dev' && mode !== 'prod') {
    throw new Error('Invalid mode:', mode);
}

console.log('Whitelisted env variables from dfx:', JSON.stringify(whitelisted, 2));

const envFileName = `.env.${mode}`;
const newEnv = Object.keys(whitelisted)
    .reduce((prev, cur) => `${prev}${cur}=${whitelisted[cur]}\n`, "");

fs.writeFileSync(envFileName, newEnv);

console.log('Successfully written whitelisted env variables to', envFileName);