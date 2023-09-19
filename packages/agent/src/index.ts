import { Agent, AnonymousIdentity, ApiQueryResponse, CallOptions, HttpAgent, Identity, QueryFields, ReadStateOptions, ReadStateResponse, SubmitResponse } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import detectEthereumProvider from "@metamask/detect-provider";
import { SNAP_METHODS, toCBOR, fromCBOR, IAgentQueryRequest, IAgentCallRequest, IAgentCreateReadStateRequestRequest, IAgentReadStateRequest, IState, IIdentityLoginRequest, TOrigin, IIdentityLinkRequest, IIdentityUnlinkRequest, IICRC1TransferRequest, IICRC1Account, IEntropyGetRequest, err, ErrorCode, IStateGetOriginDataRequest, IIdentityAddRequest, IOriginData, TIdentityId, IAgentGetUrlPrincipalAtRequest, ZLoginSiteMsg, ILoginRequestMsg } from '@fort-major/ic-snap-shared';
import { IMetaMaskEthereumProvider } from "./types";

export class MetaMaskSnapAgent implements Agent {
    private dummy: HttpAgent;

    public static async create(
        host?: string,
        snapId: string = "npm:@fort-major/ic-snap",
        snapVersion: string = "*",
        shouldBeFlask: boolean = false
    ): Promise<MetaMaskSnapAgent> {
        const provider = await detectEthereumProvider<IMetaMaskEthereumProvider>({ mustBeMetaMask: true });
        const version = await provider?.request<string>({ method: 'web3_clientVersion' });
        const isFlask = version?.includes('flask');

        if (!provider) {
            err(ErrorCode.METAMASK_ERROR, 'Install MetaMask');
        }

        if (shouldBeFlask && !isFlask) {
            err(ErrorCode.METAMASK_ERROR, 'Install MetaMask Flask');
        }

        const result = await provider.request({
            method: 'wallet_requestSnaps',
            params: {
                [snapId]: {
                    version: snapVersion,
                }
            }
        });

        if (!result) {
            err(ErrorCode.METAMASK_ERROR, 'The user denied connection request!');
        }

        return new MetaMaskSnapAgent(provider, snapId, host);
    }

    // -------------- AGENT RELATED METHODS ---------------

    public get rootKey(): ArrayBuffer | null {
        return this.dummy.rootKey;
    }

    async status(): Promise<Record<string, any>> {
        return this.dummy.status();
    }

    async fetchRootKey(): Promise<ArrayBuffer> {
        return this.dummy.fetchRootKey();
    }

    async getPrincipal(): Promise<Principal> {
        return this.requestSnap(SNAP_METHODS.agent.getPrincipal);
    }

    async query(canisterId: string | Principal, options: QueryFields): Promise<ApiQueryResponse> {
        const body: IAgentQueryRequest = {
            canisterId,
            methodName: options.methodName,
            arg: options.arg,
            host: this.host
        };

        return this.requestSnap(SNAP_METHODS.agent.query, body);
    }

    async call(canisterId: string | Principal, fields: CallOptions): Promise<SubmitResponse> {
        const body: IAgentCallRequest = {
            canisterId,
            methodName: fields.methodName,
            arg: fields.arg,
            host: this.host
        };

        return this.requestSnap(SNAP_METHODS.agent.call, body);
    }

    async createReadStateRequest?(options: ReadStateOptions): Promise<any> {
        const body: IAgentCreateReadStateRequestRequest = {
            paths: options.paths,
            host: this.host,
        };

        return this.requestSnap(SNAP_METHODS.agent.createReadStateRequest, body);
    }

    async readState(effectiveCanisterId: string | Principal, options: ReadStateOptions, _IGNORED?: Identity | undefined, request?: any): Promise<ReadStateResponse> {
        const body: IAgentReadStateRequest = {
            canisterId: effectiveCanisterId,
            paths: options.paths,
            host: this.host,
            request
        };

        return this.requestSnap(SNAP_METHODS.agent.readState, body);
    }

    async protected_getUrlPrincipalAt(origin: TOrigin, identityId: TIdentityId): Promise<Principal> {
        const body: IAgentGetUrlPrincipalAtRequest = {
            atOrigin: origin,
            identityId
        };

        return this.requestSnap(SNAP_METHODS.agent.protected_getUrlPrincipalAt, body);
    }

    // ------------ STATE RELATED METHODS -----------------

    async protected_getOriginData(ofOrigin: TOrigin): Promise<IOriginData | undefined> {
        const body: IStateGetOriginDataRequest = {
            origin: ofOrigin
        };

        return this.requestSnap(SNAP_METHODS.state.protected_getOriginData, body);
    }

    // ------------ IDENTITY RELATED METHODS --------------

    async protected_addIdentity(toOrigin: TOrigin): Promise<void> {
        const body: IIdentityAddRequest = { toOrigin };

        return this.requestSnap(SNAP_METHODS.identity.protected_add, body);
    }

    async protected_login(toOrigin: TOrigin, withIdentityId: number, withDeriviationOrigin?: TOrigin): Promise<void> {
        const body: IIdentityLoginRequest = {
            toOrigin,
            withIdentityId,
            withDeriviationOrigin: withDeriviationOrigin || toOrigin
        };

        return this.requestSnap(SNAP_METHODS.identity.protected_login, body);
    }

    // opens a new browser window with identity selection screen
    async requestLogin(): Promise<boolean> {
        // @ts-expect-error
        const origin: TOrigin = process.env.TURBO_SNAP_SITE_ORIGIN;
        const url = new URL("/login", origin);

        const childWindow = window.open(url);

        if (!childWindow) {
            err(ErrorCode.UNKOWN, 'Unable to open a new browser window');
        }

        return new Promise((res, rej) => {
            childWindow.addEventListener('message', msg => {
                if (msg.origin !== origin) {
                    return;
                }

                try {
                    const m = ZLoginSiteMsg.parse(msg.data);

                    if (m.type === 'login_site_ready') {
                        const loginRequestMsg: ILoginRequestMsg = {
                            domain: 'internet-computer-metamask-snap',
                            type: 'login_request'
                        };

                        childWindow.postMessage(loginRequestMsg, origin);

                        return;
                    }

                    if (m.type === 'login_result') {
                        res(m.result);
                        return;
                    }
                } catch (e) {
                    rej(e);
                }
            })
        })
    }

    async requestLogout(): Promise<boolean> {
        return this.requestSnap(SNAP_METHODS.identity.requestLogout);
    }

    async requestLink(withOrigin: TOrigin): Promise<boolean> {
        const body: IIdentityLinkRequest = { withOrigin };

        return this.requestSnap(SNAP_METHODS.identity.requestLink, body);
    }

    async requestUnlink(withOrigin: TOrigin): Promise<boolean> {
        const body: IIdentityUnlinkRequest = { withOrigin };

        return this.requestSnap(SNAP_METHODS.identity.requestUnlink, body);
    }

    // ------ ICRC-1 RELATED METHODS ----------

    async requestICRC1Transfer(tokenCanisterId: Principal, to: IICRC1Account, amount: bigint, memo?: Uint8Array): Promise<bigint | null> {
        const body: IICRC1TransferRequest = {
            canisterId: tokenCanisterId,
            to,
            amount,
            memo,
            host: this.host,
        };

        return this.requestSnap(SNAP_METHODS.icrc1.requestTransfer, body);
    }

    // ------ ENTROPY RELATED METHODS ---------

    async getEntropy(salt: Uint8Array): Promise<Uint8Array> {
        const body: IEntropyGetRequest = { salt };

        return this.requestSnap(SNAP_METHODS.entropy.get, body);
    }

    // ------------ PRIVATE METHODS -----------------------

    private constructor(private provider: IMetaMaskEthereumProvider, private snapId: string, private host?: string) {
        this.dummy = new HttpAgent({
            host: this.host,
            identity: new AnonymousIdentity()
        });
    }

    private async requestSnap<T, R>(method: string, body?: T): Promise<R> {
        const response = await this.provider.request<any>({
            method: "wallet_invokeSnap",
            params: {
                snapId: this.snapId,
                request: { method, params: { body: toCBOR(body) } }
            }
        });

        return fromCBOR(response);
    }
} 