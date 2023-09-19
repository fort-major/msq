const fs = require('fs');

const packageJson = JSON.parse(fs.readFileSync('./package.json'));
packageJson.version = process.env.TURBO_SNAP_VERSION;

fs.writeFileSync('./package.json', JSON.stringify(packageJson, undefined, 2));
