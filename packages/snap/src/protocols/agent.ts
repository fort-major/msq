import { SNAP_METHODS, TOrigin, ZAgentCallRequest, ZAgentGetUrlPrincipalAtRequest, ZAgentCreateReadStateRequestRequest, ZAgentQueryRequest, ZAgentReadStateRequest, fromCBOR } from '@fort-major/ic-snap-shared';
import { getIdentity, makeAgent } from '../utils';
import { Principal } from '@dfinity/principal';


export async function handleAgentQuery(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = ZAgentQueryRequest.parse(fromCBOR(bodyCBOR));

    const agent = await makeAgent(SNAP_METHODS.agent.query, origin, undefined, body.host);

    return agent.query(body.canisterId, { arg: body.arg, methodName: body.methodName });
}

export async function handleAgentCall(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = ZAgentCallRequest.parse(fromCBOR(bodyCBOR));

    const agent = await makeAgent(SNAP_METHODS.agent.call, origin, undefined, body.host);

    return agent.call(body.canisterId, { arg: body.arg, methodName: body.methodName, effectiveCanisterId: body.effectiveCanisterId });
}

export async function handleAgentCreateReadStateRequest(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = ZAgentCreateReadStateRequestRequest.parse(fromCBOR(bodyCBOR));

    const agent = await makeAgent(SNAP_METHODS.agent.createReadStateRequest, origin, undefined, body.host);

    return agent.createReadStateRequest({ paths: body.paths });
}

export async function handleAgentReadState(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = ZAgentReadStateRequest.parse(fromCBOR(bodyCBOR));

    const agent = await makeAgent(SNAP_METHODS.agent.readState, origin, undefined, body.host);

    return agent.readState(body.canisterId, { paths: body.paths }, undefined, body.request);
}

export async function handleAgentGetPrincipal(origin: TOrigin): Promise<Principal> {
    const agent = await makeAgent(SNAP_METHODS.agent.getPrincipal, origin, undefined, undefined);

    return agent.getPrincipal();
}

export async function protected_handleAgentGetUrlPrincipalAt(bodyCBOR: string): Promise<Principal> {
    const body = ZAgentGetUrlPrincipalAtRequest.parse(fromCBOR(bodyCBOR));

    const identity = await getIdentity(SNAP_METHODS.agent.protected_getUrlPrincipalAt, body.identityId, body.atOrigin, undefined);

    return identity.getPrincipal();
}