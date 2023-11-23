# Masquerade

Privacy-focused MetaMask snap for interacting with the Internet Computer (ICP)

## TODO

* landing pages
* add assets via frontend

* set snap homepage
* adaptive (best-effort)
* refine security: freeze deps versions, check all events safety, xss safety
* demo shop project add order list
* REPLACE CHARGING TOKENS (maybe make it a part of configuration)
* bump all dep versions
* test Masquerade site domain migration
* test snap storage survives upgrades
* update comments
* update tests
* readme update + inner readmes

* try implementing it as an agent again

* replace METAMASK_LINK
* storybook + design system + encapsulate more comps
* mock ICRC-1 tokens for development
* txn history
* dollars and exchange rates
* transaction history & explorer
* crypto gifts

## Local development

This project is managed with `pnpm` and `turborepo`.

* `npm i -g pnpm`
* `pnpm i -g turbo dotenv-cli`

### Install

* `pnpm install`

### Environment variables

You would need files called `.env.dev` and `.env.prod` in the root folder. Set their content as `example.env` says.
If you change any devserver host (snap, snap website or demo website), then you should also change it in `.env.dev`.
DFX env variables (starting with `CANISTER_ID_`) are propagated to vite automatically. The same goes for env variables starting with `MSQ_`.

### Run locally

* `dfx start` - (in a separate terminal window)
* `dfx extension install nns` - install nns extension to your dfx
* `cd apps/nns && dfx nns install && cd ../..` - install nns canisters
* `pnpm run gen` - generates javascript declaration files
* `pnpm run dev:build` - builds frontends for dev network
* `pnpm run dev:deployBE` - deploys all backend canisters
  * if this command fails because of locked `Cargo.toml`, run `pnpm run cargo:repair` and repeat
* `pnpm run dev` - starts a development server with both: MSQ website and Demo project

### Test

* `pnpm run test`

### Lint with eslint

* `pnpm run lint`

### Format with prettier

* `pnpm run format`

### Render documentation with typedoc

* `pnpm run doc`

### Documentation

#### How to use MSQ for local development

// TODO: tell about `setIcHost()` and `getIcHost()`

## Prod deployment

* `pnpm run gen`
* `pnpm run prod:build`
* `pnpm run prod:deploy`

## Publish

* (opt) `npm login` - don't forget to log in to your npm account
* `pnpm run pub`
