import detectEthereumProvider from "@metamask/detect-provider";
import { IGetSnapsResponse, ISnapRequest, type IMetaMaskEthereumProvider } from "./types";
import {
  type IIdentityLinkRequest,
  type IIdentityUnlinkRequest,
  type Principal,
  SNAP_METHODS,
  type TOrigin,
  delay,
  fromCBOR,
  toCBOR,
  log,
} from "@fort-major/masquerade-shared";
import { SNAP_ID, SNAP_VERSION } from ".";
import { MasqueradeIdentity } from "./identity";
import { ICRC35Connection, openICRC35Window } from "icrc-35";
import { MSQICRC35Plugin, createICRC35 } from "./plugin";

const DEFAULT_SHOULD_BE_FLASK = false;
const DEFAULT_DEBUG = false;
const DEFAULT_FORCE_REINSTALL = false;

export interface IMasqueradeClientParams {
  /** snap id, for example `npm:@fort-major/masquerade` */
  snapId?: string | undefined;
  /** snap version, for example `0.2.0` */
  snapVersion?: string | undefined;
  /** whether the user should have MetaMask Flask installed */
  shouldBeFlask?: boolean | undefined;
  /** whether to log raw requests and responses */
  debug?: boolean | undefined;
  /** makes the snap re-install on every `.create()` invocation */
  forceReinstall?: boolean | undefined;
}

export type TMasqueradeCreateResult =
  | TMsqCreateOk
  | TMsqCreateErrInstallMetaMask
  | TMsqCreateErrUnblockMetaMask
  | TMsqCreateErrEnableMetaMask;
export type TMsqCreateOk = { Ok: MasqueradeClient };
export type TMsqCreateErrInstallMetaMask = { InstallMetaMask: null };
export type TMsqCreateErrUnblockMetaMask = { UnblockMSQ: null };
export type TMsqCreateErrEnableMetaMask = { EnableMSQ: null };

/**
 * ## A client to interact with the Masquerade Snap
 */
export class MasqueradeClient {
  private queueLocked: boolean = false;

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

    const icrc35 = createICRC35(
      await ICRC35Connection.establish({
        mode: "parent",
        debug: this.debug,
        ...openICRC35Window(MSQICRC35Plugin.Origin),
      }),
    );

    const loginResult = await icrc35.plugins.MSQ.login();

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
    const icrc35 = createICRC35(
      await ICRC35Connection.establish({
        mode: "parent",
        debug: this.debug,
        ...openICRC35Window(MSQICRC35Plugin.Origin),
      }),
    );

    return icrc35.plugins.MSQ.pay({
      canisterId: tokenCanisterId.toText(),
      to: { owner: to.owner.toText(), subaccount: to.subaccount },
      amount,
      memo,
      createdAt: createdAt,
    });
  }

  async _requestSnap<T, R>(method: string, body?: T): Promise<R> {
    const req: ISnapRequest = {
      snapId: this.snapId,
      request: { method, params: { body: toCBOR(body) } },
    };

    return await this.process(req);
  }

  // serializes the queue, so all the requests are processed one-by-one
  private async process<R>(req: ISnapRequest): Promise<R> {
    const d = Math.floor(Math.random() * 13);

    while (this.queueLocked) {
      await delay(d);
    }

    this.queueLocked = true;

    if (this.debug) {
      const r = {
        snapId: req.snapId,
        request: {
          method: req.request.method,
          params: {
            body: fromCBOR(req.request.params.body),
          },
        },
      };

      log("sending", r, "to the wallet...");
    }

    const response = await this.provider.request<string>({
      method: "wallet_invokeSnap",
      params: req,
    });

    const decodedResponse: R = fromCBOR(response);

    if (this.debug) {
      log("received", decodedResponse, "from the wallet");
    }

    this.queueLocked = false;

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
  static async create(params?: IMasqueradeClientParams): Promise<TMasqueradeCreateResult> {
    let provider;

    try {
      provider = await detectEthereumProvider<IMetaMaskEthereumProvider>({
        mustBeMetaMask: true,
      });

      if (!provider) {
        return { InstallMetaMask: null };
      }
    } catch {
      return { InstallMetaMask: null };
    }

    const version = await provider!.request<string>({
      method: "web3_clientVersion",
    });
    const isFlask = version?.includes("flask");
    const snapId = params?.snapId ?? SNAP_ID;
    const snapVersion = params?.snapVersion ?? SNAP_VERSION;
    const debug = params?.debug ?? DEFAULT_DEBUG;
    const forceReinstall = params?.forceReinstall ?? DEFAULT_FORCE_REINSTALL;

    if ((params?.shouldBeFlask ?? DEFAULT_SHOULD_BE_FLASK) && !isFlask) {
      return { InstallMetaMask: null };
    }

    const getSnapsResponse: IGetSnapsResponse = await provider.request({ method: "wallet_getSnaps" });
    const msqSnap = getSnapsResponse[snapId];

    if (msqSnap === undefined) {
      await provider.request({
        method: "wallet_requestSnaps",
        params: { [snapId]: { version: snapVersion } },
      });

      return { Ok: new MasqueradeClient(provider, snapId, debug) };
    }

    if (msqSnap.blocked) {
      return { UnblockMSQ: null };
    }

    if (!msqSnap.enabled) {
      return { EnableMSQ: null };
    }

    if (msqSnap.version !== snapVersion || forceReinstall) {
      await provider.request({
        method: "wallet_requestSnaps",
        params: { [snapId]: { version: snapVersion } },
      });
    }

    return { Ok: new MasqueradeClient(provider, snapId, debug) };
  }

  private constructor(
    private readonly provider: IMetaMaskEthereumProvider,
    private readonly snapId: string,
    private readonly debug: boolean,
  ) {}
}
