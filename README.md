# Masquerade
Privacy-focused MetaMask snap for interacting with the Internet Computer (ICP)

## TODO
* tests
* comment code
* lint & prettier
* readme update + inner readmes

## Local development
This project is managed with `pnpm` and `turborepo`.

* `npm i -g pnpm`
* `pnpm i -g turbo dotenv-cli`

### Install
* `pnpm install`

### Environment variables
You would need a file called `.env.dev` in the root folder.
By default (if you're running dfx on :8080 and change nothing) its content should be equal to the content of `example.env` file.
If you change any devserver host (snap, snap website or demo website), then you should also change it in `.env.dev`.
If you want to deploy this in production, then you would need another file, called `.env.prod`. 
DFX env variables (starting with "CANISTER_ID_") are propagated to vite automatically. The same goes for env variables starting with "MSQ_".

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