import { ZodType, z } from 'zod';
import { TOrigin } from './types';

export * from './types';
export * from './encoding';

export const SNAP_METHODS = {
    identity: {
        protected_add: 'identity_protected_add',
        protected_login: 'identity_protected_login',
        protected_getLoginOptions: 'identity_protected_getLoginOptions',

        sign: 'identity_sign',
        getPublicKey: 'identity_getPublicKey',

        requestLogout: 'identity_requestLogout',
        requestLink: 'identity_requestLink',
        requestUnlink: 'identity_requestUnlink',
        getLinks: 'identity_getLinks',
    },
    state: {
        protected_getOriginData: 'state_protected_getOriginData',
        sessionExists: 'state_sessionExists',
    },
    icrc1: {
        protected_showTransferConfirm: 'icrc1_protected_showTransferConfirm'
    }
};

export enum ErrorCode {
    UNKOWN = 'MSQ_UNKNOWN',
    INVALID_RPC_METHOD = 'MSQ_INVALID_RPC_METHOD',
    INVALID_INPUT = 'MSQ_INVALID_INPUT',
    IC_ERROR = 'MSQ_IC_ERROR',
    PROTECTED_METHOD = 'MSQ_PROTECTED_METHOD',
    ICRC1_ERROR = 'MSQ_ICRC1_ERROR',
    METAMASK_ERROR = 'MSQ_METAMASK_ERROR',
    UNAUTHORIZED = 'MSQ_UNAUTHORIZED',
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

export async function delay(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

// ZodError do not work properly inside a snap, so we rethrow them here
export function zodParse<S extends ZodType<any, any, any>>(schema: S, obj: any): z.infer<typeof schema> {
    try {
        return schema.parse(obj)
    } catch (e) {
        err(ErrorCode.INVALID_INPUT, JSON.stringify(e));
    }
}

export function originToHostname(origin: TOrigin): string {
    return (new URL(origin)).hostname;
}