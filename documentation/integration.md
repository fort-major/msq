# How to integrate with MSQ

MSQ, being a MetaMask Snap, is designed to be integrated into other web-services. For these web-services, MSQ provides the following features:

* **user authorization** - MSQ provides web-services with an ability to sign arbitrary data with user's scoped key pair; in order to use that ability, a web-service has to authorize their users with MSQ;
* **ICRC-1 payments** - MSQ provides web-services with an ability to request users to perform ICRC-1 transfers, to pay for goods and services.

## Installation

In order to interact with MSQ you'll need to install our client library as a dependency to your project:

```json
// package.json

"dependencies": {
    ...
    "@fort-major/masquerade-client": "0.2.4",
    ...
}
```

The version of the client library is always tied to the version of the Snap itself, and they both follow semantic versioning. So, for example, client library "0.2.4" would work well with snaps "0.2.3", "0.2.10" or "0.3.4", but won't work with "1.2.0".

## Usage

### Setup

First of all, you have to connect to MetaMask and the Snap. Our client library does all of this under the hood, so no worries - it is easy:

```typescript
const result = await MasqueradeClient.create();
```

This function returns the following data structure:

```typescript
type Result = { Ok: MasqueradeClient } | { InstallMetaMask: null } | { UnblockMSQ: null } | { EnableMSQ: null };
```

which you can use to understand, if there was an error during the connection procedure and render a nice error screen. If everything is okay, you should be able to retrieve the client:

```typescript
import { TMsqCreateOk, MasqueradeClient } from "@fort-major/masquerade-client";

const client: MasqueradeClient = (result as TMsqCreateOk).Ok;
```

This is it! Now your app is connected to MetaMask and MSQ. If the user doesn't have MSQ installed, it will install itself to their MetaMask automatically.

### Authorization

First of all you want your users to authorize themself