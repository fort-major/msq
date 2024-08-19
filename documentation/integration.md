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
    "@fort-major/msq-client": "^0.3",
    ...
}
```

The version of the client library is always tied to the version of the Snap itself, and they both follow semantic versioning. So, for example, client library "0.2.4" would work well with snaps "0.2.3", "0.2.10" or "0.3.4", but won't work with "1.0.0".

## Usage

The best way to authenticate your users via MSQ is using the `createAndLogin()` function:

```typescript
const result = await MsqClient.createAndLogin();
```

This function will do everything for you:

1. Connect your dapp to the user's MetaMask browser extension.
2. Download and install the MSQ Snap.
3. Connect your dapp to the MSQ Snap.
4. Guide the user through the authentication process.

The first two steps are omitted for users who already have MSQ Snap installed. The third step is only executed for users who have never authenticated to your dapp before. And the last step is fast-forwarded for already authenticated users.
In other words, all the time-consuming stuff only happens for the first time. Once the user is logged in to your website, their subsequent authentication attempts will go near-instant.

You should process the `result` object the following way:

```typescript
if ("Ok" in result) {
    const { msq, identity } = result.Ok;
    // process the msq and the client objects, e.g. save to the dapps store
} else {
    // process result.Err
}
```

The `msq` object can be used for various MSQ-related flows, e.g. ICRC-1 payments (more info below).

The `identity` object is a regular `Identity` type from `@dfinity/identity`, which you can then supply into the `HttpAgent` constructor, like this:

```typescript
import { HttpAgent } from "@dfinity/agent";

const agent = new HttpAgent({ identity });
```

Which then can be used in order to call canisters on users behalf.

### Error handling

If the `result` contains a `Err` property, than something went wrong and you should probably render a nice error message:

```typescript
if ("Err" in result) {
    switch (result.Err) {
        case 'InstallMetaMask': // MetaMask browser extension is not installed
        case 'MSQConnectionRejected': // the user has explicitely rejected MetaMask connection, MSQ connection or the final login approval
        case 'MobileNotSupported': // MSQ doesn't work on mobile devices yet (but works on Android devices with Kiwi Browser in Desktop mode)
        case 'EnableMSQ': // the user has manually disabled the MSQ Snap in their MetaMask options
        case 'UnblockMSQ': // MSQ has been banned by MetaMask (very unlikely, but is an option)
    }
}
```

### More on auth sessions

MSQ employs `scoped-identity` technique, which means that a user gets a dedicated identity for every website they interact with. This is very important from the security perspective, because this protects users from signature-stealing attacks.

The authorization session lasts indefinitely (even when the user leaves your website), until explicitly stopped. When a user leaves your dapp and then returns (or simply refreshes), it is possible to automatically re-create all the objects without the user having to press the "Login" button again:

```typescript
// make sure to check, whether it is appropriate to resume without asking
if (MsqClient.isSafeToResume()) {
    const result = await MsqClient.createAndLogin();
    // repeat the same as you did on explicit logging in
}
```

In order to stop the session (log out), use the `requestLogout()` function:

```typescript
if (await msq.requestLogout()) {
    // the user agreed to log out
} else {
    // the user rejected the request to log out
}
```

MSQ users have pseudonyms and avatars. If your app doesn't have user profile functionality, but you still want to render something meaninguful for an authorized user, you can use this data.

For that you would need to call `getPseudonym()` and `getAvatarSrc()` functions of the returned `Identity` object:

```typescript
const pseudonym: string = await identity.getPseudonym();
const avatarSrc: string = await identity.getAvatarSrc();
```

`pseudonym` is just a string, which you might use instead of the username, `avatarSrc` is a string which you can use as a parameter for the `src` property of user profile picture `<img>` element:

```jsx
<h4 class="username">{pseudonym}</h4>
<img class="avatar" src={avatarSrc}/>
```

*While we generate `avatarSrc` and `pseudonym` with all the security pre-cautions in mind, it might be a good idea for you to purify this data, to double-check possible xss attack vectors. Especially if you're saving this data on backend*

## ICRC-1 Payments

You can request a user to make a payment via MSQ to a pre-defined ICRC-1 account. In order to do that you would use `requestICRC1Payment()` function:

```typescript
const blockId: bigint | null = await msq.requestICRC1Payment({
    // a canister ID of the valid `ICRC-1` token
    tokenCanisterId,
    to: {
        // payment recipient's `principal` ID
        owner,
        // payment recipient's `subaccount` ID
        subaccount,
    },
    // an amount of tokens that the user needs to transfer to the recepient
    amount,
    // an optional ICRC-1 memo (to verify the payment on-chain)
    memo,
});
```

There is too much going on, so let's stay on this function a little bit more.

First of all, this function returns either `bigint` or `null`. You should always check if the result is `null` - this would mean, that the user has changed their mind or was not able to make the payment:

```typescript
if (blockId === null) {
    renderErrorScreen("Payment failed");
}
```

If the function returns `bigint`, this would mean that the payment was successfully performed and this `bigint` is a block number of the executed ICRC-1 transaction. You can use this block number to query the token canister and verify that the payment was indeed made correctly. 

For example, you could pass this block number to your own canister, which would query the token canister, verify the payment and execute some business logic on your side (deliver the service, that the user just paid for).

The function expects to receive a *raw* amount of tokens as its `amount` parameter. For example, if you want a user to pay you 2 ICPs, you would request it like this:

```typescript
const blockId = await msq.requestICRC1Payment({
    tokenCanisterId: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"),
    to: {
        owner: myPrincipal,
        subaccount, mySubaccount,
    },
    // exact amount you want to receive, MSQ handles the fees  
    amount: 200000000n,
    memo: myMemo,
});
```

MSQ supports payments in any ICRC-1 token out-of-the-box, but there is a little catch: we whitelist ICRC-1 tokens, which are available to users by default. This means, that if you accept payments in a whitelisted token, everything will work smoothly, but if you accept a non-whitelisted token, then the user will be prompted to add this token to their personal whitelist and they might reject it.

Here is a complete list of currently whitelisted ICRC-1 tokens:

* ICP - `ryjl3-tyaaa-aaaaa-aaaba-cai`
* ckBTC - `mxzaz-hqaaa-aaaar-qaada-cai`
* ckETH - `ss2fx-dyaaa-aaaar-qacoq-cai`
* CHAT - `2ouva-viaaa-aaaaq-aaamq-cai`
* SONIC - `qbizb-wiaaa-aaaaq-aabwq-cai`
* SNS1 - `zfcdd-tqaaa-aaaaq-aaaga-cai`
* OGY - `jwcfb-hyaaa-aaaaj-aac4q-cai`
* MOD - `xsi2v-cyaaa-aaaaq-aabfq-cai`
* GHOST - `4c4fd-caaaa-aaaaq-aaa3a-cai`
* KINIC - `73mez-iiaaa-aaaaq-aaasq-cai`
* HOT - `6rdgd-kyaaa-aaaaq-aaavq-cai`
* CAT - `uf2wh-taaaa-aaaaq-aabna-cai`
* BOOM - `vtrom-gqaaa-aaaaq-aabia-cai`
* GLDGov - `tyyy3-4aaaa-aaaaq-aab7a-cai`
* ICX - `rffwt-piaaa-aaaaq-aabqq-cai`
* NTN - `f54if-eqaaa-aaaaq-aacea-cai`
* NUA - `rxdbk-dyaaa-aaaaq-aabtq-cai`
* SNEED - `hvgxa-wqaaa-aaaaq-aacia-cai`
* TRAX - `emww2-4yaaa-aaaaq-aacbq-cai`
* ICL - `hhaaz-2aaaa-aaaaq-aacla-cai`
* ELNA - `gemj7-oyaaa-aaaaq-aacnq-cai`
* OpenFPL - `ddsp7-7iaaa-aaaaq-aacqq-cai`
* ICPanda - `druyg-tyaaa-aaaaq-aactq-cai`
* ICPSwap - `ca6gz-lqaaa-aaaaq-aacwa-cai`

#### Possible issues

##### Always verify the transaction

Current version of MSQ is unable to guarantee, that the user will execute the payment request without modifying it - users **are able** to alter the request before sending it, since they control their browser. So, always check the transaction, if it has the right amount of tokens, correct recepient ids and memo. *But also keep in mind that only a dishonest user (who is also good at coding) would do that.*

##### "Lost" payments

In some extremely rare conditions, when a user performs the payment while having major network issues or their device turns off right after they've confirmed the payment, the transaction might be executed successfully, but the user wont be able to communicate the `blockId` back to your app. So your dapp won't be able to automatically verify the transaction and proceed with user's order.

The only way to solve such an issue currently is to manually find the transaction in a [block explorer](https://dashboard.internetcomputer.org/transactions) and verify it by hand.

**Don't worry.** We already work on a solution to both problems, stay tuned.

## Domain Migration

Sometimes projects change their brand and their domain name. On the IC many projects start with a default domain, provided by the system, and then change it to something meaningful. This is a problem - since in MSQ identities are scoped by the website domain name, your users won't be able to access their old identities, while accessing your website through a new domain name.

But we have a solution for that, which is called `mask linking`. You, as a developer, are able to propose your users to link their identities from the current domain to some other domain. In order to do that, use `requestLink()` function:

```typescript
const result: boolean = await msq.requestLink("https://example.com");
```

In this example, we link user's identities from the current website to `https://example.com`. It returns `boolean`, that signals if the user agreed to perform linking.

Once it is done, the next time the user will attempt to log in to `https://example.com`, they will be additionally supplied with identities from the current website.

Mask linking is not transitive. If you link users' identities from your website to `https://example.com`, and `https://example.com` links their users' identities to `https://bad-site.org`, your users won't be able to access identities from your website to log in to `https://bad-site.org`.

You can link user identities to any number of other websites. To get the list of websites, the user already linked their identities from your website, use this function:

```typescript
const links: string[] = await msq.getLinks();
```

It returns the list of origins of linked websites.

You can also unlink identities, is something goes not as you expected:

```typescript
const result: boolean = await msq.requestUnlink("https://example.com");
```

In this example we unlink user's identities from the current website from `https://example.com`, so your users won't be able to log in to `https://example.com` using identities from your website.

## Testing the integration

We don't supply developers with a special testing copy of MSQ - it would be too hard for us to maintain two copies of the same Snap and set everything right.

Instead, the original MSQ (`https://msq.tech`) can be used to test your local projects.

Since MSQ relies only on the origin of the website, that interacts with it, most of the functionality works perfectly fine, when requested from `localhost` or any other website. This means, that you can use MSQ for local authorization without doing anything special.

The only thing which won't work out-of-the-box are locally deployed ICRC-1 assets and payments. If you want to test payments in your development environment, then you should do the following:

1. Open `https://msq.tech` in your browser.
2. Open developer console.
3. Type in `setIcHost("<my-local-ic-host>")`, where `<my-local-ic-host>` is the host of your local IC replica (or the host of your staging replica, if you have one), for example `http://localhost:8080`.
4. Refresh the page.

This will make `https://msq.tech` use your local replica, when making requests to the IC, which will allow you to test locally deployed tokens and ICRC-1 payments. Obviously, this will only work in your browser - other MSQ users won't be affected.

**Be careful!** Don't forget to call `setIcHost(null)`, when you're done testing - this will reset the host to the default one.

To see what is the currenly selected ic-host use `getIcHost()`.

## Further reading

This is it! We hope this little tutorial was helpful to you. And we can't wait to see you integrating with MSQ!

For a more comprehensive example of integration, refer to the [demo project](./../apps/demo/).

Reach us out via our Discord channel, or via Github Issues, if you have any issues. Have a wonderful day!
