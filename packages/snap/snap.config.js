const envify = require('envify/custom');

const whitelistedEnv = Object.keys(process.env)
    .filter(key => key.startsWith('TURBO_'))
    .reduce((prev, cur) => ({ ...prev, [cur]: JSON.stringify(process.env[cur]) }), {});

module.exports = {
    cliOptions: {
        src: './src/index.ts',
        port: 8081,
    },
    bundlerCustomizer: (bundler) => {
        bundler.transform(
            envify(whitelistedEnv),
        );
    },
};