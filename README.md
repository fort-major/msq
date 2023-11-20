# Masquerade

Privacy-focused MetaMask snap for interacting with the Internet Computer (ICP)

## TODO

* isolate tokens logic into the site
* refactor payment flows to make them reusable

* contact us btn to payment flow
* all console errors
* better payment recovery
* trim-validate all inputs
* add disabled states during submissions
* blink animations everywhere
* loading cursor
* fix two transfers from different accounts in a row
* fix fees appear on blur
* fix blinking on balance loading
* make snap as futureproof as possible
* isolate security logic
* header with btn to integration pages
* try importing with `https://`...
* investigate other wallet-related ICRCs

* payment with unknown token (add the token automatically)
* payment by link
* QR code link to payment page
* donation page
* error pages

* refine frontend + add transitions + mobile + adaptive
* refine security: freeze deps versions, check all events safety
* landing pages
* demo shop project add order list
* REPLACE CHARGING TOKENS (maybe make it a part of configuration)
* bump all dep versions
* test Masquerade site domain migration
* test snap storage survives upgrades
* update comments
* update tests
* readme update + inner readmes

* storybook + design system + encapsulate more comps
* mock ICRC-1 tokens for development
* dollars and exchange rates
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

Since [ICP Ledger Local Setup](https://internetcomputer.org/docs/current/developer-docs/integrations/ledger/ledger-local-setup) doesn't work well when you also want to be able to deploy to mainnet, you would have to add NNS-related canisters to `dfx.json` yourself.

* `dfx start` - (in a separate terminal window)
* `dfx extension install nns` - install nns extension to your dfx
* `pnpm run dev:gen` - generates javascript declaration files
* `pnpm run dev:nns` - deploys a local copy of nns canisters
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

* `pnpm run prod:build`
* `pnpm run prod:deploy`

## Publish

* (opt) `npm login` - don't forget to log in to your npm account
* `pnpm run pub`
