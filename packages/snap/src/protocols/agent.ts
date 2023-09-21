import { SNAP_METHODS, TOrigin, ZAgentCallRequest, ZAgentGetUrlPrincipalAtRequest, ZAgentCreateReadStateRequestRequest, ZAgentQueryRequest, ZAgentReadStateRequest, fromCBOR, err, ErrorCode, zodParse } from '@fort-major/ic-snap-shared';
import { getIdentity, makeAgent, retrieveStateLocal } from '../utils';
import { Principal } from '@dfinity/principal';


export async function handleAgentQuery(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = zodParse(ZAgentQueryRequest, fromCBOR(bodyCBOR));

    const agent = await makeAgent(SNAP_METHODS.agent.query, origin, undefined, body.host, body.rootKey);

    return agent.query(body.canisterId, { arg: body.arg, methodName: body.methodName });
}

export async function handleAgentCall(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = zodParse(ZAgentCallRequest, fromCBOR(bodyCBOR));

    const agent = await makeAgent(SNAP_METHODS.agent.call, origin, undefined, body.host, body.rootKey);

    return agent.call(body.canisterId, { arg: body.arg, methodName: body.methodName, effectiveCanisterId: body.effectiveCanisterId });
}

export async function handleAgentCreateReadStateRequest(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = zodParse(ZAgentCreateReadStateRequestRequest, fromCBOR(bodyCBOR));

    const agent = await makeAgent(SNAP_METHODS.agent.createReadStateRequest, origin, undefined, body.host, body.rootKey);

    return agent.createReadStateRequest({ paths: body.paths });
}

export async function handleAgentReadState(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = zodParse(ZAgentReadStateRequest, fromCBOR(bodyCBOR));

    if (body.request) {
        err(ErrorCode.UNKOWN, JSON.stringify(body.request, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));
    }

    const agent = await makeAgent(SNAP_METHODS.agent.readState, origin, undefined, body.host, body.rootKey);

    return agent.readState(body.canisterId, { paths: body.paths }, undefined, body.request);
}

export async function handleAgentGetPrincipal(origin: TOrigin): Promise<Principal> {
    const agent = await makeAgent(SNAP_METHODS.agent.getPrincipal, origin, undefined, undefined);

    return agent.getPrincipal();
}

export async function protected_handleAgentGetUrlPrincipalAt(bodyCBOR: string): Promise<Principal> {
    const body = zodParse(ZAgentGetUrlPrincipalAtRequest, fromCBOR(bodyCBOR));

    const identity = await getIdentity(SNAP_METHODS.agent.protected_getUrlPrincipalAt, body.identityId, body.atOrigin, undefined);

    return identity.getPrincipal();
}