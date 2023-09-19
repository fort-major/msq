import { AnonymousIdentity, HttpAgent } from "@dfinity/agent";
import detectEthereumProvider from "@metamask/detect-provider";
import { SNAP_METHODS, toCBOR, isErr, fromCBOR, ERROR_CODES } from 'internet-computer-snap-shared';
export class MetaMaskSnapAgent {
    provider;
    snapId;
    host;
    dummy;
    _testRequest = null;
    static _createTest(req, host) {
        const it = new MetaMaskSnapAgent(undefined, undefined, host);
        it._testRequest = req;
        return it;
    }
    static async create(host, snapId = "npm:internet-computer-snap", snapVersion = "*") {
        const provider = await detectEthereumProvider({ mustBeMetaMask: true });
        const version = await provider?.request({ method: 'web3_clientVersion' });
        const isFlask = version?.includes('flask');
        if (!provider || !isFlask) {
            throw new Error(`[${ERROR_CODES.METAMASK_ERROR}] Install MetaMask`);
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
            throw new Error(`[${ERROR_CODES.METAMASK_ERROR}] The user denied connection request!`);
        }
        return new MetaMaskSnapAgent(provider, snapId, host);
    }
    // -------------- AGENT RELATED METHODS ---------------
    get rootKey() {
        return this.dummy.rootKey;
    }
    async status() {
        return this.dummy.status();
    }
    async fetchRootKey() {
        return this.dummy.fetchRootKey();
    }
    async getPrincipal() {
        return this.requestSnap(SNAP_METHODS.agent.getPrincipal);
    }
    async query(canisterId, options) {
        const body = {
            canisterId,
            methodName: options.methodName,
            arg: options.arg,
            host: this.host
        };
        return this.requestSnap(SNAP_METHODS.agent.query, body);
    }
    async call(canisterId, fields) {
        const body = {
            canisterId,
            methodName: fields.methodName,
            arg: fields.arg,
            host: this.host
        };
        return this.requestSnap(SNAP_METHODS.agent.call, body);
    }
    async createReadStateRequest(options) {
        const body = {
            paths: options.paths,
            host: this.host,
        };
        return this.requestSnap(SNAP_METHODS.agent.createReadStateRequest, body);
    }
    async readState(effectiveCanisterId, options, _IGNORED, request) {
        const body = {
            canisterId: effectiveCanisterId,
            paths: options.paths,
            host: this.host,
            request
        };
        return this.requestSnap(SNAP_METHODS.agent.readState, body);
    }
    // ------------ STATE RELATED METHODS -----------------
    async protected_getState() {
        return this.requestSnap(SNAP_METHODS.state.protected_get);
    }
    // ------------ IDENTITY RELATED METHODS --------------
    // opens a new browser window with identity selection screen
    async requestLogin() {
        throw new Error('Unimplemented');
    }
    async protected_login(toOrigin, withDeriviationOrigin) {
        const body = {
            toOrigin,
            withDeriviationOrigin: withDeriviationOrigin || toOrigin
        };
        return this.requestSnap(SNAP_METHODS.identity.protected_login, body);
    }
    async requestLogout() {
        return this.requestSnap(SNAP_METHODS.identity.requestLogout);
    }
    async requestShare(shareWithOrigin) {
        const body = {
            shareWithOrigin
        };
        return this.requestSnap(SNAP_METHODS.identity.requestShare, body);
    }
    async requestUnshare(unshareWithOrigin) {
        const body = {
            unshareWithOrigin
        };
        return this.requestSnap(SNAP_METHODS.identity.requestUnshare, body);
    }
    // ------ ICRC-1 RELATED METHODS ----------
    async requestICRC1Transfer(tokenCanisterId, to, amount, memo) {
        const body = {
            canisterId: tokenCanisterId,
            to,
            amount,
            memo,
            host: this.host,
        };
        return this.requestSnap(SNAP_METHODS.icrc1.requestTransfer, body);
    }
    // ------ ENTROPY RELATED METHODS ---------
    async getEntropy(salt) {
        const body = { salt };
        return this.requestSnap(SNAP_METHODS.entropy.get, body);
    }
    // ------------ PRIVATE METHODS -----------------------
    constructor(provider, snapId, host) {
        this.provider = provider;
        this.snapId = snapId;
        this.host = host;
        this.dummy = new HttpAgent({
            host: this.host,
            identity: new AnonymousIdentity()
        });
    }
    async requestSnap(method, body) {
        let response;
        if (this._testRequest) {
            const r = this._testRequest({
                method,
                params: { body: toCBOR(body) },
                // @ts-expect-error
                origin: process.env.TURBO_SNAP_SITE_ORIGIN
            });
            try {
                // @ts-expect-error
                const ui = await r.getInterface();
                console.log('Snap ui appears');
                if (ui) {
                    throw JSON.stringify(ui);
                    console.log(ui);
                    await ui.ok();
                }
            }
            catch (e) {
                if (typeof e === 'string') {
                    console.error(e);
                }
            }
            response = (await r).response.result;
        }
        else if (this.provider) {
            response = await this.provider.request({
                method: "wallet_invokeSnap",
                params: {
                    snapId: this.snapId,
                    request: { method, params: { body: toCBOR(body) } }
                }
            });
        }
        else {
            throw new Error('Unreacheable');
        }
        if (isErr(response)) {
            throw new Error(`[${response.code}] ${response.msg}`);
        }
        return fromCBOR(response.payload);
    }
}
