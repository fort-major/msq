const fs = require('fs');

const packageJson = JSON.parse(fs.readFileSync('./package.json'));
packageJson.version = process.env.TURBO_SNAP_VERSION;

fs.writeFileSync('./package.json', JSON.stringify(packageJson, undefined, 2));

if (fs.existsSync('./snap.manifest.json')) {
    const manifest = JSON.parse(fs.readFileSync('./snap.manifest.json'));
    manifest.version = process.env.TURBO_SNAP_VERSION;

    fs.writeFileSync('./snap.manifest.json', JSON.stringify(manifest, undefined, 2));
}