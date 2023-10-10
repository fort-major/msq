import detectEthereumProvider from "@metamask/detect-provider";
import { type IMetaMaskEthereumProvider } from "./types";
import {
  ErrorCode,
  type IIdentityLinkRequest,
  type IIdentityUnlinkRequest,
  type ILoginRequestMsg,
  type ILoginSiteMsg,
  type IWalletSiteICRC1TransferMsg,
  type IWalletSiteMsg,
  type Principal,
  SNAP_METHODS,
  type TOrigin,
  ZLoginSiteMsg,
  ZWalletSiteMsg,
  debugStringify,
  delay,
  err,
  fromCBOR,
  toCBOR,
  zodParse,
} from "@fort-major/masquerade-shared";
import { type SignIdentity } from "@dfinity/agent";
import { SNAP_ID, SNAP_SITE_ORIGIN, SNAP_VERSION } from ".";
import { MasqueradeIdentity } from "./identity";

const DEFAULT_SHOULD_BE_FLASK = false;
const DEFAULT_DEBUG = false;

export interface IMasqueradeClientParams {
  snapId?: string | undefined;
  snapVersion?: string | undefined;
  shouldBeFlask?: boolean | undefined;
  debug?: boolean | undefined;
}

export class MasqueradeClient {
  async isAuthorized(): Promise<boolean> {
    return await this._requestSnap(SNAP_METHODS.public.state.sessionExists);
  }

  async requestLogin(): Promise<SignIdentity | null> {
    if (await this.isAuthorized()) {
      return await MasqueradeIdentity.create(this);
    }

    // eslint-disable-next-line no-async-promise-executor
    return await new Promise(async (resolve, reject) => {
      const url = new URL("/login", SNAP_SITE_ORIGIN);

      const childWindow = window.open(url, "_blank");

      if (childWindow === null) {
        err(ErrorCode.UNKOWN, "Unable to open a new browser window");
      }

      let receivedReady = false;

      const loginRequestMsg: ILoginRequestMsg = {
        domain: "internet-computer-metamask-snap",
        type: "login_request",
      };

      window.addEventListener("message", async (msg) => {
        if (msg.origin !== SNAP_SITE_ORIGIN) {
          return;
        }

        let loginSiteMsg: ILoginSiteMsg;

        try {
          loginSiteMsg = zodParse(ZLoginSiteMsg, msg.data);
        } catch (e) {
          reject(e);
          return;
        }

        if (loginSiteMsg.type === "login_site_ready") {
          receivedReady = true;
          return;
        }

        if (loginSiteMsg.type === "login_result") {
          if (!loginSiteMsg.result) {
            resolve(null);
            return;
          }

          await MasqueradeIdentity.create(this).then(resolve);
        }
      });

      while (!receivedReady) {
        await delay(500);

        try {
          childWindow.postMessage(loginRequestMsg, SNAP_SITE_ORIGIN);
        } catch (e) {
          /* ignore */
        }
      }
    });
  }

  async requestLogout(): Promise<boolean> {
    return await this._requestSnap(SNAP_METHODS.public.identity.requestLogout);
  }

  async requestLink(withOrigin: TOrigin): Promise<boolean> {
    const body: IIdentityLinkRequest = { withOrigin };

    return await this._requestSnap(
      SNAP_METHODS.public.identity.requestLink,
      body,
    );
  }

  async requestUnlink(withOrigin: TOrigin): Promise<boolean> {
    const body: IIdentityUnlinkRequest = { withOrigin };

    return await this._requestSnap(
      SNAP_METHODS.public.identity.requestUnlink,
      body,
    );
  }

  async getLinks(): Promise<TOrigin[]> {
    return await this._requestSnap(SNAP_METHODS.public.identity.getLinks);
  }

  async requestICRC1Transfer(
    tokenCanisterId: Principal,
    to: { owner: Principal; subaccount?: Uint8Array | undefined },
    amount: bigint,
    memo?: Uint8Array | undefined,
    createdAt?: bigint | undefined,
  ): Promise<bigint | null> {
    // eslint-disable-next-line no-async-promise-executor
    return await new Promise<bigint | null>(async (resolve, reject) => {
      const url = new URL("/wallet", SNAP_SITE_ORIGIN);

      const childWindow = window.open(url, "_blank");

      if (childWindow === null) {
        err(ErrorCode.UNKOWN, "Unable to open a new browser window");
      }

      let receivedReady = false;

      const transferRequestMsg: IWalletSiteICRC1TransferMsg = {
        domain: "internet-computer-metamask-snap",
        type: "transfer_icrc1_request",
        request: {
          canisterId: tokenCanisterId.toText(),
          to: { owner: to.owner.toText(), subaccount: to.subaccount },
          amount,
          memo,
          created_at_time: createdAt,
        },
      };

      window.addEventListener("message", (msg) => {
        if (msg.origin !== SNAP_SITE_ORIGIN) {
          return;
        }

        let walletSiteMsg: IWalletSiteMsg;

        try {
          walletSiteMsg = zodParse(ZWalletSiteMsg, msg.data);
        } catch (e) {
          reject(e);
          return;
        }

        if (walletSiteMsg.type === "wallet_site_ready") {
          receivedReady = true;
          return;
        }

        if (walletSiteMsg.type === "transfer_icrc1_result") {
          resolve(walletSiteMsg.result ?? null);
        }
      });

      while (!receivedReady) {
        await delay(500);

        try {
          childWindow.postMessage(transferRequestMsg, SNAP_SITE_ORIGIN);
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
      console.log(
        `Received ${debugStringify(decodedResponse)} from the wallet`,
      );
    }

    return decodedResponse;
  }

  static async create(
    params?: IMasqueradeClientParams,
  ): Promise<MasqueradeClient> {
    const provider = await detectEthereumProvider<IMetaMaskEthereumProvider>({
      mustBeMetaMask: true,
    });

    if (provider === null) {
      err(ErrorCode.METAMASK_ERROR, "Install MetaMask");
    }

    const version = await provider.request<string>({
      method: "web3_clientVersion",
    });
    const isFlask = version?.includes("flask");
    const snapId = params?.snapId ?? SNAP_ID;
    const snapVersion = params?.snapVersion ?? SNAP_VERSION;

    if ((params?.shouldBeFlask ?? DEFAULT_SHOULD_BE_FLASK) && !isFlask) {
      err(ErrorCode.METAMASK_ERROR, "Install MetaMask Flask");
    }

    await provider.request({
      method: "wallet_requestSnaps",
      params: {
        [snapId]: { version: snapVersion },
      },
    });

    return new MasqueradeClient(provider, snapId, params?.debug);
  }

  private constructor(
    private readonly provider: IMetaMaskEthereumProvider,
    private readonly snapId: string,
    private readonly debug: boolean = DEFAULT_DEBUG,
  ) {}
}
