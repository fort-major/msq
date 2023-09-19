import { heading, panel, text } from "@metamask/snaps-ui";
import { Json } from "@metamask/snaps-types";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import nacl from "tweetnacl";
import { ErrorCode, IOriginData, IState, SNAP_METHODS, TIdentityId, TOrigin, ZState, err, hexToBytes, unreacheable } from "@fort-major/ic-snap-shared";
import { AnonymousIdentity, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

// this is executed during the 'verify' build step process
// when the snap is evaluated in SES
// if it passes during the build step, it will also pass in runtime
if (!process.env.TURBO_SNAP_SITE_ORIGIN) {
    throw new Error(`Bad build: snap site origin is '${process.env.TURBO_SNAP_SITE_ORIGIN}'`);
}

// protected methods are those which could be executed only 
// from the Internet Computer Snap website
const PROTECTED_METHODS = [
    SNAP_METHODS.identity.protected_add,
    SNAP_METHODS.identity.protected_login,
    SNAP_METHODS.state.protected_getOriginData,
    SNAP_METHODS.agent.protected_getUrlPrincipalAt,
];

export function guardMethods(method: string, origin: TOrigin) {
    // let other methods pass
    if (!PROTECTED_METHODS.includes(method)) {
        return;
    }

    // validate origin to be Internet Computer Snap website
    if (origin !== JSON.parse(process.env.TURBO_SNAP_SITE_ORIGIN as string)) {
        return err(ErrorCode.PROTECTED_METHOD, `Method ${method} can only be executed from the Internet Computer Snap website (${origin} != ${process.env.TURBO_SNAP_SITE_ORIGIN})`);
    }

    // pass if all good
    return;
}

export function makeEntropySalt(type: 'identityUrl' | 'identityCanisterId' | 'custom', body: string) {
    return `\x0a${type}\n${body}`;
}

// url-derived identity is used by default for most interactions
const URL_DERIVED_IDENTITY_METHODS = [
    ...Object.values(SNAP_METHODS.agent),
    ...Object.values(SNAP_METHODS.identity),
    ...Object.values(SNAP_METHODS.state),
    ...Object.values(SNAP_METHODS.entropy)
];

async function getUrlIdentity(origin: TOrigin, identityId: TIdentityId): Promise<IcIdentity> {
    const entropy = await snap.request({
        method: "snap_getEntropy",
        params: {
            version: 1,
            salt: makeEntropySalt('identityUrl', `${origin}\n${identityId}`)
        }
    });

    return identityFromEntropy(hexToBytes(entropy.slice(2)));
}

// canisterId-derived identity is used to interact with particular canisters
const CANISTER_ID_DERIVED_IDENTITY_METHODS = [
    ...Object.values(SNAP_METHODS.icrc1),
];

async function getCanisterIdIdentity(canisterId: Principal, identityId: TIdentityId): Promise<IcIdentity> {
    const entropy = await snap.request({
        method: "snap_getEntropy",
        params: {
            version: 1,
            salt: makeEntropySalt('identityCanisterId', `${canisterId.toText()}\n${identityId}`)
        }
    });

    return identityFromEntropy(hexToBytes(entropy.slice(2)));
}

export async function getIdentity(method: string, identityId: TIdentityId, origin?: TOrigin, canisterId?: Principal): Promise<IcIdentity> {
    if (URL_DERIVED_IDENTITY_METHODS.includes(method)) {
        if (!origin) throw new Error('Unreacheable');

        return await getUrlIdentity(origin, identityId);

    } else if (CANISTER_ID_DERIVED_IDENTITY_METHODS.includes(method)) {
        if (!canisterId) throw new Error('Unreacheable');

        return await getCanisterIdIdentity(canisterId, identityId);

    } else {
        throw new Error('Unsupported method');
    }
}

export async function makeAgent(method: string, origin?: TOrigin, canisterId?: Principal, host?: TOrigin): Promise<HttpAgent> {
    if (canisterId && origin) { unreacheable('mageAgent() - both: origin and canisterId are present') };

    let identity;

    if (origin) {
        const state = await retrieveStateLocal();

        const originData = state.originData[origin];
        const session = originData?.currentSession;

        if (!originData || !session) {
            identity = new AnonymousIdentity();
        } else {
            identity = await getIdentity(method, session.identityId, session.deriviationOrigin, undefined);
        }
    } else if (canisterId) {
        identity = await getIdentity(method, 0, undefined, canisterId)
    } else {
        unreacheable('mageAgent() - none: origin nor canister are present')
    }

    return new HttpAgent({
        fetch,
        identity,
        host,
    });
}

export async function retrieveStateLocal(): Promise<IState> {
    let state = await snap.request({
        method: "snap_manageState",
        params: {
            operation: "get"
        }
    });

    if (!state) {
        await persistStateLocal(DEFAULT_STATE);
        return DEFAULT_STATE;
    }

    return ZState.parse(state);
}

export async function persistStateLocal(state: IState): Promise<void> {
    await snap.request({
        method: "snap_manageState",
        params: {
            operation: "update",
            newState: state as unknown as Record<string, Json>,
        }
    });
}

export async function debugAlert(str: string, origin: string) {
    await snap.request({
        method: 'snap_dialog',
        params: {
            type: 'alert',
            content: panel([
                heading(`Message from ${origin}`),
                text(str)
            ])
        }
    });
}

const DEFAULT_STATE: IState = {
    originData: {}
};

export const DEFAULT_ORIGIN_DATA: IOriginData = {
    identitiesTotal: 1,
    currentSession: undefined,
    links: []
};

// TODO: [before alpha] - replace with Secp256k1 identity
type IcIdentity = Ed25519KeyIdentity;

function identityFromEntropy(entropy: Uint8Array): IcIdentity {
    const keyPair = nacl.sign.keyPair.fromSeed(entropy)

    return Ed25519KeyIdentity.fromKeyPair(keyPair.publicKey.buffer, keyPair.secretKey.buffer);
}