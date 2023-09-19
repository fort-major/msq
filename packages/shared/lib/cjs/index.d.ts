import { IResult } from './types';
export * from './types';
export * from './encoding';
export declare const SNAP_METHODS: {
    agent: {
        getPrincipal: string;
        query: string;
        call: string;
        createReadStateRequest: string;
        readState: string;
    };
    identity: {
        protected_login: string;
        requestLogout: string;
        requestShare: string;
        requestUnshare: string;
    };
    state: {
        protected_get: string;
    };
    entropy: {
        get: string;
    };
    icrc1: {
        requestTransfer: string;
    };
};
export declare enum ERROR_CODES {
    UNKOWN = 0,
    INVALID_RPC_METHOD = 1,
    INVALID_INPUT = 2,
    IC_ERROR = 3,
    PROTECTED_METHOD = 4,
    ICRC1_ERROR = 5,
    METAMASK_ERROR = 6
}
export declare function ok<T>(payload: T): IResult;
export declare function err(code: number, msg: string): IResult;
