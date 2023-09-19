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
        protected_add: 'identity_protected_add',
        protected_login: 'identity_protected_login',
        requestLogout: 'identity_requestLogout',
        requestLink: 'identity_requestLink',
        requestUnlink: 'identity_requestUnlink',
    },
    state: {
        protected_getOriginData: 'state_protected_getOriginData',
    },
    entropy: {
        get: 'entropy_get',
    },
    icrc1: {
        requestTransfer: 'icrc1_requestTransfer',
    }
};

export enum ErrorCode {
    UNKOWN = 'UNKNOWN',
    INVALID_RPC_METHOD = 'INVALID_RPC_METHOD',
    INVALID_INPUT = 'INVALID_INPUT',
    IC_ERROR = 'IC_ERROR',
    PROTECTED_METHOD = 'PROTECTED_METHOD',
    ICRC1_ERROR = 'ICRC1_ERROR',
    METAMASK_ERROR = 'METAMASK_ERROR',
}

export function err(code: ErrorCode, msg: string): never {
    throw new Error(`[${code}]: ${msg}`)
}

export function unreacheable(msg?: string): never {
    if (!msg) {
        throw new Error('Unreacheable');
    } else {
        throw new Error(`Unreacheable: ${msg}`);
    }
}