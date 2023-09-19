import { Agent, ApiQueryResponse, CallOptions, Identity, QueryFields, ReadStateOptions, ReadStateResponse, SubmitResponse } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IState, TOrigin, IICRC1Account } from 'internet-computer-snap-shared';
export declare class MetaMaskSnapAgent implements Agent {
    private provider?;
    private snapId?;
    private host?;
    private dummy;
    private _testRequest;
    static _createTest(req: (req: {
        method: string;
        params: any;
    }) => Promise<any>, host?: string | undefined): MetaMaskSnapAgent;
    static create(host?: string, snapId?: string, snapVersion?: string): Promise<MetaMaskSnapAgent>;
    get rootKey(): ArrayBuffer | null;
    status(): Promise<Record<string, any>>;
    fetchRootKey(): Promise<ArrayBuffer>;
    getPrincipal(): Promise<Principal>;
    query(canisterId: string | Principal, options: QueryFields): Promise<ApiQueryResponse>;
    call(canisterId: string | Principal, fields: CallOptions): Promise<SubmitResponse>;
    createReadStateRequest?(options: ReadStateOptions): Promise<any>;
    readState(effectiveCanisterId: string | Principal, options: ReadStateOptions, _IGNORED?: Identity | undefined, request?: any): Promise<ReadStateResponse>;
    protected_getState(): Promise<IState>;
    requestLogin(): Promise<boolean>;
    protected_login(toOrigin: TOrigin, withDeriviationOrigin?: TOrigin): Promise<void>;
    requestLogout(): Promise<boolean>;
    requestShare(shareWithOrigin: TOrigin): Promise<boolean>;
    requestUnshare(unshareWithOrigin: TOrigin): Promise<boolean>;
    requestICRC1Transfer(tokenCanisterId: Principal, to: IICRC1Account, amount: bigint, memo?: Uint8Array): Promise<bigint | null>;
    getEntropy(salt: Uint8Array): Promise<Uint8Array>;
    private constructor();
    private requestSnap;
}
