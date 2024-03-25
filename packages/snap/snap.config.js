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
  environment: whitelistedEnv,
};
