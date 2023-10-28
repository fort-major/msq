import detectEthereumProvider from "@metamask/detect-provider";
import { IGetSnapsResponse, type IMetaMaskEthereumProvider } from "./types";
import {
  ErrorCode,
  type IIdentityLinkRequest,
  type IIdentityUnlinkRequest,
  type ILoginRequestMsg,
  type IICRC1TransferRequestMsg,
  type Principal,
  SNAP_METHODS,
  type TOrigin,
  debugStringify,
  delay,
  err,
  fromCBOR,
  toCBOR,
  ZRequestReceivedMsg,
  ZLoginResultMsg,
  ZICRC1TransferResultMsg,
} from "@fort-major/masquerade-shared";
import { SNAP_ID, SNAP_SITE_ORIGIN as MASQUERADE_SITE_ORIGIN, SNAP_VERSION } from ".";
import { MasqueradeIdentity } from "./identity";

const DEFAULT_SHOULD_BE_FLASK = false;
const DEFAULT_DEBUG = false;

export interface IMasqueradeClientParams {
  /** snap id, for example `npm:@fort-major/masquerade` */
  snapId?: string | undefined;
  /** snap version, for example `0.2.0` */
  snapVersion?: string | undefined;
  /** whether the user should have MetaMask Flask installed */
  shouldBeFlask?: boolean | undefined;
  /** whether to log raw requests and responses, makes the snap re-install on every `.create()` invocation */
  debug?: boolean | undefined;
}

/**
 * ## A client to interact with the Masquerade Snap
 */
export class MasqueradeClient {
  private childWindow: Window | null = null;

  /**
   * ## Returns true if the user is logged in current website
   *
   * @see {@link requestLogin}
   * @see {@link requestLogout}
   *
   * @returns
   */
  async isAuthorized(): Promise<boolean> {
    return await this._requestSnap(SNAP_METHODS.public.identity.sessionExists);
  }

  /**
   * ## Proposes the user to log in to current website
   *
   * Opens up a separate browser window with the Masquerade website that will guide the user through the authorization process.
   *
   * @see {@link requestLogout}
   * @see {@link isAuthorized}
   *
   * @returns - {@link MasqueradeIdentity} if the login was a success, `null` otherwise
   */
  async requestLogin(): Promise<MasqueradeIdentity | null> {
    if (await this.isAuthorized()) {
      return MasqueradeIdentity.create(this);
    }

    if (this.childWindow !== null) {
      err(ErrorCode.SECURITY_VIOLATION, "Another operation is in-progress");
    }

    const self = this;

    const url = new URL("/integration/login", MASQUERADE_SITE_ORIGIN);
    self.childWindow = window.open(url, "_blank");

    if (self.childWindow === null) {
      err(ErrorCode.UNKOWN, "Unable to open a new browser window");
    }

    const loginResult = await new Promise<boolean>(async (resolve, reject) => {
      let loginRequestReceived = false;

      const loginRequestMsg: ILoginRequestMsg = {
        domain: "msq",
        type: "login_request",
      };

      function handleMsg(msg: MessageEvent) {
        if (msg.origin !== MASQUERADE_SITE_ORIGIN || !msg.isTrusted) {
          return;
        }

        if (self.debug) {
          console.log(msg);
        }

        try {
          if (!loginRequestReceived) {
            ZRequestReceivedMsg.parse(msg.data);
            loginRequestReceived = true;

            if (self.debug) {
              console.log("received ready msg, waiting for the result...");
            }

            return;
          }

          // try parsing until it happens
          try {
            let loginResultMsg = ZLoginResultMsg.parse(msg.data);
            resolve(loginResultMsg.result);

            window.removeEventListener("message", handleMsg);
            self.childWindow = null;
          } catch (_) {
            return;
          }
        } catch (e) {
          reject(e);

          window.removeEventListener("message", handleMsg);
          self.childWindow = null;
        }
      }

      window.addEventListener("message", handleMsg);

      while (!loginRequestReceived) {
        await delay(100);

        try {
          self.childWindow!.postMessage(loginRequestMsg, MASQUERADE_SITE_ORIGIN);
        } catch (e) {
          /* ignore */
        }
      }
    });

    return loginResult ? MasqueradeIdentity.create(this) : null;
  }

  /**
   * ## Proposes the user to log out from the current website
   *
   * Opens up a pop-up MetaMask window to confirm this action.
   *
   * @see {@link requestLogin}
   * @see {@link isAuthorized}
   *
   * @returns whether the user was logged out
   */
  async requestLogout(): Promise<boolean> {
    return await this._requestSnap(SNAP_METHODS.public.identity.requestLogout);
  }

  /**
   * ## Proposes the user to link all their masks on the current website to another website
   *
   * Opens up a pop-up MetaMask window to confirm this action.
   *
   * This will allow the user to log in to the target website using the same identities they use on this website.
   * This is useful for domain migration, so the users could continue to use their old principals when an app moves to another domain.
   *
   * The links are __unidirectional__ - this website won't be able to use target user's masks on the target website. The target website
   * should itself create another link (by calling this function for the user) to make that happen.
   *
   * @see {@link requestUnlink}
   * @see {@link getLinks}
   *
   * @param withOrigin - {@link TOrigin} - target website origin
   * @returns whether the user linked their masks
   */
  async requestLink(withOrigin: TOrigin): Promise<boolean> {
    const body: IIdentityLinkRequest = { withOrigin };

    return await this._requestSnap(SNAP_METHODS.public.identity.requestLink, body);
  }

  /**
   * ## Proposes the user to unlink all their masks on the current website from another website
   *
   * Opens up a pop-up MetaMask window to confirm this action.
   *
   * @see {@link requestLink}
   * @see {@link getLinks}
   *
   * @param withOrigin
   * @returns whether the user unlinked their masks
   */
  async requestUnlink(withOrigin: TOrigin): Promise<boolean> {
    const body: IIdentityUnlinkRequest = { withOrigin };

    return await this._requestSnap(SNAP_METHODS.public.identity.requestUnlink, body);
  }

  /**
   * ## Returns all user mask links coming from this website
   *
   * @see {@link requestLink}
   * @see {@link requestUnlink}
   *
   * @returns an array of {@link TOrigin} to which the current website created a link to
   */
  async getLinks(): Promise<TOrigin[]> {
    return await this._requestSnap(SNAP_METHODS.public.identity.getLinks);
  }

  /**
   * ## Proposes the user to transfer tokens via ICRC-1 token standard
   *
   * Opens up a separate browser window with the Masquerade website that will guide the user through the payment process.
   *
   * This function greatly simplifies payments, since now you can just request the user to pay you for something,
   * without worrying about user identity being different on your website than on the wallet website.
   *
   * @param tokenCanisterId - {@link Principal} - a canister ID of the valid `ICRC-1` token
   * @param to.owner - {@link Principal} - payment recipient's `principal` ID
   * @param to.owner - (optional) {@link Uint8Array} - payment recipient's `subaccount` ID
   * @param amount - {@link bigint} - an amount of tokens that the user needs to transfer to the recepient (fees applied automatically)
   * @param memo - (optional) {@link Uint8Array} - memo field (32-bytes max) for transaction identification
   * @param createdAt - (optional) {@link bigint} - transaction creation time in nanoseconds (set automatically to `Date.now()` if not passed)
   * @returns - {@link bigint} - block ID that can be used for transaction verification or `null` if the payment failed
   */
  async requestICRC1Transfer(
    tokenCanisterId: Principal,
    to: { owner: Principal; subaccount?: Uint8Array | undefined },
    amount: bigint,
    memo?: Uint8Array | undefined,
    createdAt?: bigint | undefined,
  ): Promise<bigint | null> {
    if (this.childWindow !== null) {
      err(ErrorCode.SECURITY_VIOLATION, "Another operation is in-progress");
    }

    const self = this;

    const url = new URL("/wallet", MASQUERADE_SITE_ORIGIN);
    self.childWindow = window.open(url, "_blank");

    if (self.childWindow === null) {
      err(ErrorCode.UNKOWN, "Unable to open a new browser window");
    }

    // eslint-disable-next-line no-async-promise-executor
    return await new Promise<bigint | null>(async (resolve, reject) => {
      let transferRequestReceived = false;

      const transferRequestMsg: IICRC1TransferRequestMsg = {
        domain: "msq",
        type: "transfer_icrc1_request",
        request: {
          canisterId: tokenCanisterId.toText(),
          to: { owner: to.owner.toText(), subaccount: to.subaccount },
          amount,
          memo,
          createdAt: createdAt,
        },
      };

      function handleMsg(msg: MessageEvent) {
        if (msg.origin !== MASQUERADE_SITE_ORIGIN || !msg.isTrusted) {
          return;
        }

        if (self.debug) {
          console.log(msg);
        }

        try {
          if (!transferRequestReceived) {
            ZRequestReceivedMsg.parse(msg.data);
            transferRequestReceived = true;
            return;
          }

          // try parsing until it happens
          try {
            const resultMsg = ZICRC1TransferResultMsg.parse(msg.data);
            resolve(resultMsg.result ?? null);

            window.removeEventListener("message", handleMsg);
            self.childWindow = null;
          } catch (_) {
            return;
          }
        } catch (e) {
          reject(e);

          window.removeEventListener("message", handleMsg);
          self.childWindow = null;
        }
      }

      window.addEventListener("message", handleMsg);

      while (!transferRequestReceived) {
        await delay(100);

        try {
          self.childWindow!.postMessage(transferRequestMsg, MASQUERADE_SITE_ORIGIN);
        } catch (e) {
          /* ignore */
        }
      }
    });
  }

  async _requestSnap<T, R>(method: string, body?: T): Promise<R> {
    const params = {
      snapId: this.snapId,
      request: { method, params: { body: toCBOR(body) } },
    };

    if (this.debug) {
      console.log(`Sending ${debugStringify(params)} to the wallet...`);
    }

    const response = await this.provider.request<string>({
      method: "wallet_invokeSnap",
      params,
    });

    const decodedResponse: R = fromCBOR(response);

    if (this.debug) {
      console.log(`Received ${debugStringify(decodedResponse)} from the wallet`);
    }

    return decodedResponse;
  }

  /**
   * ## Connects to the Masquerade MetaMask Snap
   *
   * Opens up a MetaMask pop-up to guide the user through the process.
   *
   * Default parameters should work fine for most use-cases.
   *
   * This function will:
   *  - check if MetaMask is installed, throwing an error if not
   *  - check if the Masquerade snap is installed, installing it automatically if not
   *
   * @param params - {@link IMasqueradeClientParams}
   * @returns - an initialized {@link MasqueradeClient} object that can be used right away
   */
  static async create(params?: IMasqueradeClientParams): Promise<MasqueradeClient> {
    const provider = await detectEthereumProvider<IMetaMaskEthereumProvider>({
      mustBeMetaMask: true,
    });

    if (provider === null) {
      err(ErrorCode.METAMASK_ERROR, "Install MetaMask");
    }

    const version = await provider!.request<string>({
      method: "web3_clientVersion",
    });
    const isFlask = version?.includes("flask");
    const snapId = params?.snapId ?? SNAP_ID;
    const snapVersion = params?.snapVersion ?? SNAP_VERSION;
    const debug = params?.debug ?? false;

    if ((params?.shouldBeFlask ?? DEFAULT_SHOULD_BE_FLASK) && !isFlask) {
      err(ErrorCode.METAMASK_ERROR, "Install MetaMask Flask");
    }

    const getSnapsResponse: IGetSnapsResponse = await provider.request({ method: "wallet_getSnaps" });
    const msqSnap = getSnapsResponse[snapId];

    if (msqSnap === undefined || debug) {
      await provider.request({
        method: "wallet_requestSnaps",
        params: { [snapId]: { version: snapVersion } },
      });

      return new MasqueradeClient(provider, snapId, debug);
    }

    if (msqSnap.blocked) {
      err(ErrorCode.METAMASK_ERROR, "Unblock the Masquerade snap");
    }

    if (!msqSnap.enabled) {
      err(ErrorCode.METAMASK_ERROR, "Enable the Masquerade snap");
    }

    if (msqSnap.version !== snapVersion) {
      await provider.request({
        method: "wallet_requestSnaps",
        params: { [snapId]: { version: snapVersion } },
      });
    }

    return new MasqueradeClient(provider, snapId, debug);
  }

  private constructor(
    private readonly provider: IMetaMaskEthereumProvider,
    private readonly snapId: string,
    private readonly debug: boolean = DEFAULT_DEBUG,
  ) {}
}
