import detectEthereumProvider from "@metamask/detect-provider";
import { IMetaMaskEthereumProvider } from "./types";
import { ErrorCode, IEntropyGetRequest, IIdentityLinkRequest, IIdentityUnlinkRequest, ILoginRequestMsg, ILoginSiteMsg, IWalletSiteICRC1TransferMsg, IWalletSiteMsg, Principal, SNAP_METHODS, TOrigin, ZLoginSiteMsg, ZWalletSiteMsg, debugStringify, delay, err, fromCBOR, toCBOR, zodParse } from "@fort-major/masquerade-shared";
import { Identity } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { SNAP_ID, SNAP_SITE_ORIGIN, SNAP_VERSION } from ".";

const DEFAULT_SHOULD_BE_FLASK = false;
const DEFAULT_DEBUG = false;

export interface ISnapClientParams {
    snapId?: string | undefined,
    snapVersion?: string | undefined,
    shouldBeFlask?: boolean | undefined,
    debug?: boolean | undefined,
}

export class SnapClient {
    async requestLogin(): Promise<Identity | null> {
        return new Promise(async (res, rej) => {
            const url = new URL("/login", SNAP_SITE_ORIGIN);

            const childWindow = window.open(url, '_blank');

            if (!childWindow) {
                err(ErrorCode.UNKOWN, 'Unable to open a new browser window');
            }

            let receivedReady = false;

            const loginRequestMsg: ILoginRequestMsg = {
                domain: 'internet-computer-metamask-snap',
                type: 'login_request'
            };

            window.addEventListener('message', msg => {
                if (msg.origin !== SNAP_SITE_ORIGIN) {
                    return;
                }

                let loginSiteMsg: ILoginSiteMsg;

                try {
                    loginSiteMsg = zodParse(ZLoginSiteMsg, msg.data);
                } catch (e) {
                    return rej(e);
                }

                if (loginSiteMsg.type === 'login_site_ready') {
                    receivedReady = true;
                    return;
                }

                if (loginSiteMsg.type === 'login_result') {
                    if (loginSiteMsg.result === undefined) {
                        return res(null);
                    }

                    const identity = Ed25519KeyIdentity.fromJSON(loginSiteMsg.result);

                    return res(identity);
                }
            });

            while (!receivedReady) {
                await delay(500);

                try {
                    childWindow.postMessage(loginRequestMsg, SNAP_SITE_ORIGIN);
                } catch (e) { }
            }
        });
    }

    async requestLogout(): Promise<boolean> {
        return this._requestSnap(SNAP_METHODS.identity.requestLogout);
    }

    async requestLink(withOrigin: TOrigin): Promise<boolean> {
        const body: IIdentityLinkRequest = { withOrigin };

        return this._requestSnap(SNAP_METHODS.identity.requestLink, body);
    }

    async requestUnlink(withOrigin: TOrigin): Promise<boolean> {
        const body: IIdentityUnlinkRequest = { withOrigin };

        return this._requestSnap(SNAP_METHODS.identity.requestUnlink, body);
    }

    async requestICRC1Transfer(
        tokenCanisterId: Principal,
        to: { owner: Principal, subaccount?: Uint8Array | undefined },
        amount: bigint,
        memo?: Uint8Array | undefined,
        created_at_time?: bigint | undefined
    ): Promise<bigint | null> {
        return new Promise<bigint | null>(async (res, rej) => {
            const url = new URL("/wallet", SNAP_SITE_ORIGIN);

            const childWindow = window.open(url, '_blank');

            if (!childWindow) {
                err(ErrorCode.UNKOWN, 'Unable to open a new browser window');
            }

            let receivedReady = false;

            const transferRequestMsg: IWalletSiteICRC1TransferMsg = {
                domain: 'internet-computer-metamask-snap',
                type: 'transfer_icrc1_request',
                request: {
                    canisterId: tokenCanisterId.toText(),
                    to: { owner: to.owner.toText(), subaccount: to.subaccount },
                    amount,
                    memo,
                    created_at_time
                }
            };

            window.addEventListener('message', msg => {
                if (msg.origin !== SNAP_SITE_ORIGIN) {
                    return;
                }

                let walletSiteMsg: IWalletSiteMsg;

                try {
                    walletSiteMsg = zodParse(ZWalletSiteMsg, msg.data);
                } catch (e) {
                    return rej(e);
                }

                if (walletSiteMsg.type === 'wallet_site_ready') {
                    receivedReady = true;
                    return;
                }

                if (walletSiteMsg.type === 'transfer_icrc1_result') {
                    return res(walletSiteMsg.result || null);
                }
            });

            while (!receivedReady) {
                await delay(500);

                try {
                    childWindow.postMessage(transferRequestMsg, SNAP_SITE_ORIGIN);
                } catch (e) { }
            }
        });
    }

    async getEntropy(salt: Uint8Array): Promise<Uint8Array> {
        const body: IEntropyGetRequest = { salt };

        return this._requestSnap(SNAP_METHODS.entropy.get, body);
    }

    async _requestSnap<T, R>(method: string, body?: T): Promise<R> {
        const params = {
            snapId: this.snapId,
            request: { method, params: { body: toCBOR(body) } }
        };

        if (this.debug) {
            console.log(`Sending ${debugStringify(params)} to the wallet...`)
        }

        const response = await this.provider.request<any>({
            method: "wallet_invokeSnap",
            params
        });

        const decodedResponse = fromCBOR(response);

        if (this.debug) {
            console.log(`Received ${debugStringify(decodedResponse)} from the wallet`);
        }

        return decodedResponse;
    }

    static async create(params?: ISnapClientParams): Promise<SnapClient> {
        const provider = await detectEthereumProvider<IMetaMaskEthereumProvider>({ mustBeMetaMask: true });
        const version = await provider?.request<string>({ method: 'web3_clientVersion' });
        const isFlask = version?.includes('flask');

        const snapId = params?.snapId || SNAP_ID;
        const snapVersion = params?.snapVersion || SNAP_VERSION;

        if (!provider) {
            err(ErrorCode.METAMASK_ERROR, 'Install MetaMask');
        }

        if ((params?.shouldBeFlask || DEFAULT_SHOULD_BE_FLASK) && !isFlask) {
            err(ErrorCode.METAMASK_ERROR, 'Install MetaMask Flask');
        }

        const result = await provider.request({
            method: 'wallet_requestSnaps',
            params: {
                [snapId]: { version: snapVersion }
            }
        });

        if (!result) {
            err(ErrorCode.METAMASK_ERROR, 'The user denied connection request!');
        }

        return new SnapClient(provider, snapId, params?.debug);;
    }

    private constructor(
        private provider: IMetaMaskEthereumProvider,
        private snapId: string,
        private debug: boolean = DEFAULT_DEBUG,
    ) { }
}