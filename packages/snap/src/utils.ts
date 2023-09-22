import { heading, panel, text } from "@metamask/snaps-ui";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import nacl from "tweetnacl";
import { ErrorCode, IOriginData, IState, SNAP_METHODS, TBlob, TIdentityId, TOrigin, ZState, debugStringify, err, fromCBOR, hexToBytes, toCBOR, unreacheable, zodParse } from "@fort-major/ic-snap-shared";
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
    SNAP_METHODS.identity.protected_setSiteSession,
    SNAP_METHODS.state.protected_getOriginData,
    SNAP_METHODS.state.protected_getSiteSession,
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

export function makeEntropySalt(type: 'identityOrigin' | 'identityCanisterId' | 'custom', body: string) {
    return `\x0a${type}\n${body}`;
}

async function getOriginIdentity(origin: TOrigin, identityId: TIdentityId): Promise<IcIdentity> {
    const entropy = await snap.request({
        method: "snap_getEntropy",
        params: {
            version: 1,
            salt: makeEntropySalt('identityOrigin', `${origin}\n${identityId}`)
        }
    });

    return identityFromEntropy(hexToBytes(entropy.slice(2)));
}

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

export type HttpAgentExt = HttpAgent & { identityId?: TIdentityId };
export const ANONYMOUS_IDENTITY_ID = Number.MAX_SAFE_INTEGER;

async function makeRegularAgent(origin: TOrigin, host?: TOrigin, rootKey?: TBlob): Promise<HttpAgentExt> {
    const state = await retrieveStateLocal();

    const originData = state.originData[origin];
    const session = originData?.currentSession;

    let identity, identityId;
    if (!originData || !session) {
        identity = new AnonymousIdentity();
        identityId = ANONYMOUS_IDENTITY_ID;
    } else {
        identity = await getOriginIdentity(session.deriviationOrigin, session.identityId);
        identityId = session.identityId;
    }

    const agent: HttpAgentExt = new HttpAgent({
        fetch,
        identity,
        host
    });

    agent.identityId = identityId;

    if (rootKey) {
        agent.rootKey = rootKey;
        // @ts-expect-error
        agent._rootKeyFetched = true;
    }

    return agent;
}

async function makeSiteAgent(host?: TOrigin, rootKey?: TBlob): Promise<HttpAgentExt> {
    const state = await retrieveStateLocal();
    const siteSession = state.siteSession;

    let identity, identityId;
    if (!siteSession) {
        identity = new AnonymousIdentity();
        identityId = ANONYMOUS_IDENTITY_ID;
    } else if (siteSession.type === 'origin') {
        identity = await getOriginIdentity(siteSession.origin, siteSession.identityId);
        identityId = siteSession.identityId;
    } else {
        identity = await getCanisterIdIdentity(siteSession.canisterId, siteSession.identityId);
        identityId = siteSession.identityId;
    }

    const agent: HttpAgentExt = new HttpAgent({
        fetch,
        identity,
        host
    });

    agent.identityId = identityId;

    if (rootKey) {
        agent.rootKey = rootKey;
        // @ts-expect-error
        agent._rootKeyFetched = true;
    }

    return agent;
}

export async function makeAgent(origin: TOrigin, host?: TOrigin, rootKey?: TBlob): Promise<HttpAgentExt> {
    if (origin === process.env.TURBO_SNAP_SITE_ORIGIN) {
        return makeSiteAgent(host, rootKey);
    } else {
        return makeRegularAgent(origin, host, rootKey);
    }
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

    // @ts-expect-error
    return zodParse(ZState, fromCBOR(state.data));
}

export async function persistStateLocal(state: IState): Promise<void> {
    await snap.request({
        method: "snap_manageState",
        params: {
            operation: "update",
            newState: { data: toCBOR(state) },
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

type IcIdentity = Ed25519KeyIdentity;

function identityFromEntropy(entropy: Uint8Array): IcIdentity {
    const keyPair = nacl.sign.keyPair.fromSeed(entropy)

    return Ed25519KeyIdentity.fromKeyPair(keyPair.publicKey.buffer, keyPair.secretKey.buffer);
}