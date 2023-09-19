# Internet Computer MetaMask Snap
Allows authorizing within IC dapps with MetaMask

## TODO
* auto logout on timer
* tests
* lint & prettier

## Local development
This project is managed with `pnpm` and `turborepo`.

* `npm i -g pnpm`
* `pnpm i -g turbo dotenv-cli`

### Install
* `pnpm install`

### Build
* `pnpm run build`

### Run locally
* `pnpm run dev:start` - (in a separate terminal window) starts a local replica with '--clean' flag
* `pnpm run dev:gen` - generates javascript declaration files
* `pnpm run dev:nns` - deploys a local copy of nns canisters
* `pnpm run dev:deploy` - deploys site_backend canister
    * if this command fails because of locked `Cargo.toml` do the following - `cd apps/site && cargo build --target=wasm32-unknown-unknown`
* `pnpm run dev` - starts site_frontend dev server

### Publish
* (opt) `npm login` - don't forget to log in to your npm account
* `pnpm run pub`