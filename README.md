# Masquerade

Privacy-focused MetaMask snap for interacting with the Internet Computer (ICP)

## TODO

* stats for protected methods + express as annotations? + stats page
* demo shop project
* make spoilers closed by default
* load data in two iterations: query -> certified
* loader & header to html
* rearrange the layout so it stretches

* payment page + fees
* donation page
* better payment recovery
* trim-validate all inputs
* add disabled states during submissions
* refine security: freeze deps versions, check all events safety
* blink animations everywhere
* refine frontend + add transitions + mobile + adaptive
* landing pages
* bump all dep versions
* test Masquerade site domain migration
* test snap storage survives upgrades
* update comments
* update tests
* readme update + inner readmes

* storybook + design system + encapsulate more comps
* mock ICRC-1 tokens for development
* dollars and exchange rates

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

### Test

* `pnpm run test`

### Lint with eslint

* `pnpm run lint`

### Format with prettier

* `pnpm run format`

### Render documentation with typedoc

* `pnpm run doc`