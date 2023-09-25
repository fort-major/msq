const fs = require('fs');
const dotenv = require('dotenv');

const env = dotenv.config({ path: '../../.env' }).parsed;

let fileCjs = fs.readFileSync('dist/cjs/index.js', 'utf8');
let fileEsm = fs.readFileSync('dist/esm/index.js', 'utf8');

for (let v of Object.keys(env)) {
    fileCjs = fileCjs.replace(`process.env.${v}`, `"${env[v]}"`);
    fileEsm = fileEsm.replace(`process.env.${v}`, `"${env[v]}"`);
}

fs.writeFileSync('dist/cjs/index.js', fileCjs);
fs.writeFileSync('dist/esm/index.js', fileEsm);

console.log('Env variables inlined into client');