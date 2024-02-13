import { installSnap } from "@metamask/snaps-jest";
import {
  IIdentityGetLoginOptionsRequest,
  IIdentityGetLoginOptionsResponse,
  IIdentityLinkRequest,
  IIdentityLoginRequest,
  IIdentityUnlinkRequest,
  SNAP_METHODS,
  ZIdentityGetLoginOptionsResponse,
  fromCBOR,
  toCBOR,
  zodParse,
} from "@fort-major/msq-shared";
import { MSQ_SNAP_SITE, ok } from "./utils";

describe("Authentication", () => {
  it("should have no session by default", async () => {
    const snap = await installSnap();

    const { response } = await snap.request({
      origin: "http://localhost:8080",
      method: SNAP_METHODS.public.identity.sessionExists,
      params: { body: toCBOR(undefined) },
    });

    expect(ok(response)).toBe(toCBOR(false));

    await snap.close();
  });

  it("should have at least one login option by default", async () => {
    const snap = await installSnap();

    const req: IIdentityGetLoginOptionsRequest = {
      forOrigin: "http://localhost:8081",
    };

    const { response } = await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.getLoginOptions,
      params: { body: toCBOR(req) },
    });

    const result = zodParse(ZIdentityGetLoginOptionsResponse, fromCBOR(ok(response) as string));

    expect(result.length).toBeGreaterThanOrEqual(1);

    await snap.close();
  });

  it("should create a session on login and remove it on logout", async () => {
    const snap = await installSnap();

    // login
    const req: IIdentityLoginRequest = {
      toOrigin: "http://localhost:8081",
      withLinkedOrigin: "http://localhost:8081",
      withIdentityId: 0,
    };

    const snapResp1 = await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req) },
    });

    expect(ok(snapResp1.response)).toBe(toCBOR(true));

    // check session
    const snapResp2 = await snap.request({
      origin: "http://localhost:8081",
      method: SNAP_METHODS.public.identity.sessionExists,
      params: { body: toCBOR(undefined) },
    });

    expect(ok(snapResp2.response)).toBe(toCBOR(true));

    // logout
    const snapResp3Promise = snap.request({
      origin: "http://localhost:8081",
      method: SNAP_METHODS.public.identity.requestLogout,
      params: { body: toCBOR(undefined) },
    });

    const ui = await snapResp3Promise.getInterface();
    await ui.ok();

    const snapResp3 = await snapResp3Promise;

    expect(ok(snapResp3.response)).toBe(toCBOR(true));

    // check session once again
    const snapResp4 = await snap.request({
      origin: "http://localhost:8081",
      method: SNAP_METHODS.public.identity.sessionExists,
      params: { body: toCBOR(undefined) },
    });

    expect(ok(snapResp4.response)).toBe(toCBOR(false));

    await snap.close();
  });

  it("should have no links by default", async () => {
    const snap = await installSnap();

    const snapResp1 = await snap.request({
      origin: "http://localhost:8081",
      method: SNAP_METHODS.public.identity.getLinks,
      params: { body: toCBOR(undefined) },
    });

    expect(ok(snapResp1.response)).toBe(toCBOR([]));

    await snap.close();
  });

  it("shouldn't be possible to login via another website without a link", async () => {
    const snap = await installSnap();

    const req: IIdentityLoginRequest = {
      toOrigin: "http://localhost:8081",
      withLinkedOrigin: "http://localhost:8082",
      withIdentityId: 0,
    };

    const snapResp1 = await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req) },
    });

    expect(() => ok(snapResp1.response)).toThrowError();

    await snap.close();
  });

  it("should be possible to create a link, login via another website, logout, remove link and not being able to login anymore", async () => {
    const snap = await installSnap();
    const site = "http://localhost:8081";
    const anotherSite = "http://localhost:8082";

    // create link
    const req1: IIdentityLinkRequest = {
      withOrigin: anotherSite,
    };

    const snapResp1Promise = snap.request({
      origin: site,
      method: SNAP_METHODS.public.identity.requestLink,
      params: { body: toCBOR(req1) },
    });

    const ui = await snapResp1Promise.getInterface();
    await ui.ok();

    const snapResp1 = await snapResp1Promise;

    expect(ok(snapResp1.response)).toBe(toCBOR(true));

    // login
    const req2: IIdentityLoginRequest = {
      toOrigin: anotherSite,
      withLinkedOrigin: site,
      withIdentityId: 0,
    };

    const snapResp2 = await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req2) },
    });

    expect(ok(snapResp2.response)).toBe(toCBOR(true));

    // logout
    const snapResp3Promise = snap.request({
      origin: anotherSite,
      method: SNAP_METHODS.public.identity.requestLogout,
      params: { body: toCBOR(undefined) },
    });

    const ui3 = await snapResp3Promise.getInterface();
    await ui3.ok();

    const snapResp3 = await snapResp3Promise;

    expect(ok(snapResp3.response)).toBe(toCBOR(true));

    // remove link
    const req4: IIdentityUnlinkRequest = {
      withOrigin: anotherSite,
    };

    const snapResp4Promise = snap.request({
      origin: site,
      method: SNAP_METHODS.public.identity.requestUnlink,
      params: { body: toCBOR(req4) },
    });

    const ui4 = await snapResp4Promise.getInterface();
    await ui4.ok();

    const snapResp4 = await snapResp4Promise;

    expect(ok(snapResp4.response)).toBe(toCBOR(true));

    // try login again
    const snapResp5 = await snap.request({
      origin: MSQ_SNAP_SITE,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req2) },
    });

    expect(() => ok(snapResp5.response)).toThrowError();

    await snap.close();
  });

  it("many links should work fine", async () => {
    const snap = await installSnap();
    const site = "https://dfinity.org";

    // create links
    for (let i = 0; i < 10; i++) {
      const req: IIdentityLinkRequest = {
        withOrigin: `https://site-${i}.com`,
      };

      const respPromise = snap.request({
        origin: site,
        method: SNAP_METHODS.public.identity.requestLink,
        params: { body: toCBOR(req) },
      });

      const ui = await respPromise.getInterface();
      await ui.ok();

      const resp = await respPromise;

      expect(ok(resp.response)).toBe(toCBOR(true));
    }

    // login via linked site
    for (let i = 0; i < 10; i++) {
      const s = `https://site-${i}.com`;

      const req1: IIdentityGetLoginOptionsRequest = {
        forOrigin: s,
      };

      const resp1 = await snap.request({
        origin: MSQ_SNAP_SITE,
        method: SNAP_METHODS.protected.identity.getLoginOptions,
        params: { body: toCBOR(req1) },
      });

      const options: IIdentityGetLoginOptionsResponse = fromCBOR(ok(resp1.response) as string);

      expect(options.length).toBe(2);
      expect(options[0][0]).toBe(s);
      expect(options[1][0]).toBe(site);

      const req2: IIdentityLoginRequest = {
        toOrigin: s,
        withLinkedOrigin: site,
        withIdentityId: 0,
      };

      const resp2 = await snap.request({
        origin: MSQ_SNAP_SITE,
        method: SNAP_METHODS.protected.identity.login,
        params: { body: toCBOR(req2) },
      });

      expect(ok(resp2.response)).toBe(toCBOR(true));
    }

    await snap.close();
  });
});
