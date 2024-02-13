import { installSnap } from "@metamask/snaps-jest";
import {
  IIdentityGetPublicKeyRequest,
  IIdentityLinkRequest,
  IIdentityLoginRequest,
  IIdentitySignRequest,
  SNAP_METHODS,
  bytesToHex,
  fromCBOR,
  toCBOR,
} from "@fort-major/msq-shared";
import { MSQ_SNAP_SITE, ok } from "./utils";

describe("Signatures", () => {
  it("shouldn't be possible to sign or get pubkey without a session", async () => {
    const snap = await installSnap();

    const req1: IIdentitySignRequest = {
      challenge: new Uint8Array([1, 2, 3, 4]),
      salt: new Uint8Array(),
    };

    const resp1 = await snap.request({
      origin: "https://google.com",
      method: SNAP_METHODS.public.identity.sign,
      params: { body: toCBOR(req1) },
    });

    expect(() => ok(resp1.response)).toThrow();

    const resp2 = await snap.request({
      origin: "https://google.com",
      method: SNAP_METHODS.public.identity.getPublicKey,
      params: { body: toCBOR(undefined) },
    });

    expect(() => ok(resp2.response)).toThrow();

    await snap.close();
  });

  it("should be possible to sign with a session created", async () => {
    const snap = await installSnap();
    const site = "http://localhost:8080";

    // login
    const req1: IIdentityLoginRequest = {
      toOrigin: site,
      withIdentityId: 0,
    };

    const resp1 = await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req1) },
    });

    expect(ok(resp1.response)).toBe(toCBOR(true));

    // sign
    const req2: IIdentitySignRequest = {
      challenge: new Uint8Array([1, 2, 3, 4]),
      salt: new Uint8Array(),
    };

    const resp2 = await snap.request({
      origin: site,
      method: SNAP_METHODS.public.identity.sign,
      params: { body: toCBOR(req2) },
    });

    const signature: Uint8Array = fromCBOR(ok(resp2.response) as string);
    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(64);

    await snap.close();
  });

  it("same input should produce the same signature", async () => {
    const snap = await installSnap();
    const site = "http://localhost:8080";

    // login
    const req1: IIdentityLoginRequest = {
      toOrigin: site,
      withIdentityId: 0,
    };

    const resp1 = await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req1) },
    });

    expect(ok(resp1.response)).toBe(toCBOR(true));

    // sign first time
    const req2: IIdentitySignRequest = {
      challenge: new Uint8Array([1, 2, 3, 4]),
      salt: new Uint8Array([]),
    };

    const resp2 = await snap.request({
      origin: site,
      method: SNAP_METHODS.public.identity.sign,
      params: { body: toCBOR(req2) },
    });

    const signature1: Uint8Array = fromCBOR(ok(resp2.response) as string);

    // sign second time
    const resp3 = await snap.request({
      origin: site,
      method: SNAP_METHODS.public.identity.sign,
      params: { body: toCBOR(req2) },
    });

    const signature2: Uint8Array = fromCBOR(ok(resp3.response) as string);

    expect(toCBOR(signature1)).toBe(toCBOR(signature2));

    await snap.close();
  });

  it("different salt produces different signatures and pubkeys", async () => {
    const snap = await installSnap();
    const site = "http://localhost:8080";

    // login
    const req1: IIdentityLoginRequest = {
      toOrigin: site,
      withIdentityId: 0,
    };

    const resp1 = await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req1) },
    });

    expect(ok(resp1.response)).toBe(toCBOR(true));

    const signaturesAndPubkeys: [Uint8Array, Uint8Array][] = [];

    for (let i = 0; i < 10; i++) {
      const req: IIdentitySignRequest = {
        challenge: new Uint8Array([1, 2, 3, 4]),
        salt: new Uint8Array([i]),
      };

      const resp = await snap.request({
        origin: site,
        method: SNAP_METHODS.public.identity.sign,
        params: { body: toCBOR(req) },
      });

      const signature: Uint8Array = fromCBOR(ok(resp.response) as string);

      const re1: IIdentityGetPublicKeyRequest = {
        salt: new Uint8Array([i]),
      };

      const resp1 = await snap.request({
        origin: site,
        method: SNAP_METHODS.public.identity.getPublicKey,
        params: { body: toCBOR(re1) },
      });

      const pubkey: Uint8Array = fromCBOR(ok(resp1.response) as string);

      signaturesAndPubkeys.push([signature, pubkey]);
    }

    const signatures = new Set();
    const pubkeys = new Set();

    for (const [s, p] of signaturesAndPubkeys) {
      signatures.add(toCBOR(s));
      pubkeys.add(toCBOR(p));
    }

    expect(signatures.size).toBe(10);
    expect(pubkeys.size).toBe(10);

    await snap.close();
  });

  it("different origins and identityIds produce different entropy", async () => {
    const snap = await installSnap();

    // login to two different origins
    const req1: IIdentityLoginRequest = {
      toOrigin: "http://google.com",
      withIdentityId: 0,
    };

    const req2: IIdentityLoginRequest = {
      toOrigin: "https://google.com",
      withIdentityId: 0,
    };

    await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req1) },
    });

    await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req2) },
    });

    // get pubkeys on this origins
    const req4: IIdentityGetPublicKeyRequest = {
      salt: new Uint8Array(),
    };

    const resp1 = await snap.request({
      origin: "http://google.com",
      method: SNAP_METHODS.public.identity.getPublicKey,
      params: { body: toCBOR(req4) },
    });
    const pubkey1 = bytesToHex(fromCBOR(ok(resp1.response) as string));

    const resp2 = await snap.request({
      origin: "https://google.com",
      method: SNAP_METHODS.public.identity.getPublicKey,
      params: { body: toCBOR(req4) },
    });
    const pubkey2 = bytesToHex(fromCBOR(ok(resp2.response) as string));

    expect(pubkey1).not.toBe(pubkey2);

    // try to re-login to the first site with another identityId

    const req3: IIdentityLoginRequest = {
      toOrigin: "http://google.com",
      withIdentityId: 1,
    };

    await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req3) },
    });

    const resp3 = await snap.request({
      origin: "http://google.com",
      method: SNAP_METHODS.public.identity.getPublicKey,
      params: { body: toCBOR(req4) },
    });
    const pubkey3 = bytesToHex(fromCBOR(ok(resp3.response) as string));

    expect(pubkey3).not.toBe(pubkey1);
    expect(pubkey3).not.toBe(pubkey2);

    await snap.close();
  });

  it("logging in via another linked website should produce entropy as on this website", async () => {
    const snap = await installSnap();
    const site = "https://google.com";
    const anotherSite = "https://dfinity.org";

    // link
    const req1: IIdentityLinkRequest = {
      withOrigin: anotherSite,
    };

    const resp1Promise = snap.request({
      origin: site,
      method: SNAP_METHODS.public.identity.requestLink,
      params: { body: toCBOR(req1) },
    });

    const ui1 = await resp1Promise.getInterface();
    await ui1.ok();

    const resp1 = await resp1Promise;

    expect(ok(resp1.response)).toBe(toCBOR(true));

    // login to site
    const req2: IIdentityLoginRequest = {
      toOrigin: site,
      withIdentityId: 0,
    };

    const resp2 = await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req2) },
    });

    expect(ok(resp2.response)).toBe(toCBOR(true));

    // login to anotherSite via site
    const req3: IIdentityLoginRequest = {
      toOrigin: anotherSite,
      withLinkedOrigin: site,
      withIdentityId: 0,
    };

    const resp3 = await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req3) },
    });

    expect(ok(resp3.response)).toBe(toCBOR(true));

    // get pubkeys
    const req4: IIdentityGetPublicKeyRequest = {
      salt: new Uint8Array(),
    };

    const resp4 = await snap.request({
      origin: site,
      method: SNAP_METHODS.public.identity.getPublicKey,
      params: { body: toCBOR(req4) },
    });

    const pubkey1 = bytesToHex(fromCBOR(ok(resp4.response) as string));

    const resp5 = await snap.request({
      origin: anotherSite,
      method: SNAP_METHODS.public.identity.getPublicKey,
      params: { body: toCBOR(req4) },
    });

    const pubkey2 = bytesToHex(fromCBOR(ok(resp5.response) as string));

    expect(pubkey1).toBe(pubkey2);

    // sign something

    const req5: IIdentitySignRequest = {
      challenge: new Uint8Array([100, 200]),
      salt: new Uint8Array(),
    };

    const resp6 = await snap.request({
      origin: site,
      method: SNAP_METHODS.public.identity.sign,
      params: { body: toCBOR(req5) },
    });

    const signature1 = bytesToHex(fromCBOR(ok(resp6.response) as string));

    const resp7 = await snap.request({
      origin: anotherSite,
      method: SNAP_METHODS.public.identity.sign,
      params: { body: toCBOR(req5) },
    });

    const signature2 = bytesToHex(fromCBOR(ok(resp7.response) as string));

    expect(signature1).toBe(signature2);

    await snap.close();
  });
});
