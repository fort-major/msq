import { toCBOR } from './encoding';
export * from './types';
export * from './encoding';
export const SNAP_METHODS = {
    agent: {
        getPrincipal: 'agent_getPrincipal',
        query: 'agent_query',
        call: 'agent_call',
        createReadStateRequest: 'agent_createReadStateRequest',
        readState: 'agent_readState',
    },
    identity: {
        protected_login: 'identity_protected_login',
        requestLogout: 'identity_requestLogout',
        requestShare: 'identity_requestShare',
        requestUnshare: 'identity_requestUnshare',
    },
    state: {
        protected_get: 'state_protected_get',
    },
    entropy: {
        get: 'entropy_get',
    },
    icrc1: {
        requestTransfer: 'icrc1_requestTransfer',
    }
};
export var ERROR_CODES;
(function (ERROR_CODES) {
    ERROR_CODES[ERROR_CODES["UNKOWN"] = 0] = "UNKOWN";
    ERROR_CODES[ERROR_CODES["INVALID_RPC_METHOD"] = 1] = "INVALID_RPC_METHOD";
    ERROR_CODES[ERROR_CODES["INVALID_INPUT"] = 2] = "INVALID_INPUT";
    ERROR_CODES[ERROR_CODES["IC_ERROR"] = 3] = "IC_ERROR";
    ERROR_CODES[ERROR_CODES["PROTECTED_METHOD"] = 4] = "PROTECTED_METHOD";
    ERROR_CODES[ERROR_CODES["ICRC1_ERROR"] = 5] = "ICRC1_ERROR";
    ERROR_CODES[ERROR_CODES["METAMASK_ERROR"] = 6] = "METAMASK_ERROR";
})(ERROR_CODES || (ERROR_CODES = {}));
export function ok(payload) {
    return { status: 'Ok', payload: toCBOR(payload) };
}
export function err(code, msg) {
    return { status: 'Err', code, msg };
}
