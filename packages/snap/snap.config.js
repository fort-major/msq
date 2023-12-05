const whitelistedEnv = Object.keys(process.env)
  .filter((key) => key.startsWith("MSQ_"))
  .reduce((prev, cur) => ({ ...prev, [cur]: JSON.stringify(process.env[cur]) }), {});

module.exports = {
  bundler: "webpack",
  input: "./src/index.ts",
  output: {
    path: "dist",
    filename: "bundle.js",
    clean: true,
    minimize: true,
  },
  polyfills: {
    assert: true,
    crypto: true,
    buffer: true,
    util: true,
    events: true,
    string_decoder: true,
    stream: true,
  },
  environment: whitelistedEnv,
};
