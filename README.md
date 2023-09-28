# Masquerade
Privacy-focused MetaMask snap for interacting with the Internet Computer (ICP)

## TODO
* better confirmation windows
* add confirmation on transfer
* refactor env variables
* add second demo site and check mask linking
* tests & security critical code isolation
* comment code
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
* `dfx start` - (in a separate terminal window)
* `dfx extension install nns` - install nns extension to your dfx
* `pnpm run dev:gen` - generates javascript declaration files
* `pnpm run dev:nns` - deploys a local copy of nns canisters
* `pnpm run dev:deploy` - deploys site_backend canister
    * if this command fails because of locked `Cargo.toml`, run `pnpm run cargo:repair` and repeat 
* `pnpm run dev` - starts site_frontend dev server

### Publish
* (opt) `npm login` - don't forget to log in to your npm account
* `pnpm run pub`