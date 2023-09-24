import { ErrorCode, TOrigin, ZAgentCallRequest, ZAgentCreateReadStateRequestRequest, ZAgentQueryRequest, ZAgentReadStateRequest, err, fromCBOR, zodParse } from '@fort-major/ic-snap-shared';
import { makeAgent } from '../utils';


export async function handleAgentQuery(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = zodParse(ZAgentQueryRequest, fromCBOR(bodyCBOR));

    const agent = await makeAgent(origin, body.host, body.rootKey);

    console.log('getPrincipal', (await agent.getPrincipal()).toText());

    return agent.query(body.canisterId, { arg: body.arg, methodName: body.methodName });
}

export async function handleAgentCall(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = zodParse(ZAgentCallRequest, fromCBOR(bodyCBOR));

    const agent = await makeAgent(origin, body.host, body.rootKey);

    console.log('getPrincipal', (await agent.getPrincipal()).toText());

    return agent.call(body.canisterId, { arg: body.arg, methodName: body.methodName, effectiveCanisterId: body.effectiveCanisterId });
}

export async function handleAgentCreateReadStateRequest(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = zodParse(ZAgentCreateReadStateRequestRequest, fromCBOR(bodyCBOR));

    const agent = await makeAgent(origin, body.host, body.rootKey);

    console.log('getPrincipal', (await agent.getPrincipal()).toText());

    return agent.createReadStateRequest({ paths: body.paths });
}

export async function handleAgentReadState(bodyCBOR: string, origin: TOrigin): Promise<any> {
    const body = zodParse(ZAgentReadStateRequest, fromCBOR(bodyCBOR));

    const agent = await makeAgent(origin, body.host, body.rootKey);

    console.log('getPrincipal', (await agent.getPrincipal()).toText());

    return agent.readState(body.canisterId, { paths: body.paths }, undefined, body.request);
}

export async function handleAgentGetPrincipal(origin: TOrigin): Promise<string> {
    const agent = await makeAgent(origin);

    console.log('getPrincipal', (await agent.getPrincipal()).toText());

    return (await agent.getPrincipal()).toText();
}

