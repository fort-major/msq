import { installSnap } from "@metamask/snaps-jest";
import { ok } from "./utils";
import {
  IIdentityAddRequest,
  IIdentityGetLoginOptionsRequest,
  IIdentityLoginRequest,
  IShowICRC1TransferConfirmRequest,
  SNAP_METHODS,
  toCBOR,
} from "@fort-major/msq-shared";

describe("Protected methods", () => {
  it("should only be called from MSQ website", async () => {
    const snap = await installSnap();
    const badSite = "https://bad-site.com";

    // show icrc1 confirm window
    const req1: IShowICRC1TransferConfirmRequest = {
      from: "aaaaa-aa",
      requestOrigin: "http://site.com",
      ticker: "ICP",
      to: {
        owner: "aaaaa-aa",
        subaccount: new Uint8Array([1, 3, 3, 7]),
      },
      totalAmountStr: "123.1234412",
      totalAmount: BigInt(1231234412),
    };

    const resp1 = await snap.request({
      origin: badSite,
      method: SNAP_METHODS.protected.icrc1.showTransferConfirm,
      params: { body: toCBOR(req1) },
    });

    expect(() => ok(resp1.response)).toThrowError();

    // login
    const req2: IIdentityLoginRequest = {
      toOrigin: badSite,
      withIdentityId: 0,
    };

    const resp2 = await snap.request({
      origin: badSite,
      method: SNAP_METHODS.protected.identity.login,
      params: { body: toCBOR(req2) },
    });

    expect(() => ok(resp2.response)).toThrowError();

    // get login options
    const req3: IIdentityGetLoginOptionsRequest = {
      forOrigin: badSite,
    };

    const resp3 = await snap.request({
      origin: badSite,
      method: SNAP_METHODS.protected.identity.getLoginOptions,
      params: { body: toCBOR(req3) },
    });

    expect(() => ok(resp3.response)).toThrowError();

    // add new mask
    const req4: IIdentityAddRequest = {
      toOrigin: badSite,
    };

    const resp4 = await snap.request({
      origin: badSite,
      method: SNAP_METHODS.protected.identity.add,
      params: { body: toCBOR(req4) },
    });

    expect(() => ok(resp4.response)).toThrowError();

    await snap.close();
  });
});
