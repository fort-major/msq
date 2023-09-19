import { TOrigin, ZEntropyGetRequest, hexToBytes, fromCBOR, unreacheable } from "internet-computer-snap-shared";
import { makeEntropySalt, retrieveStateLocal } from "../utils";


export async function handleEntropyGet(bodyCBOR: string, origin: TOrigin): Promise<Uint8Array> {
    const body = ZEntropyGetRequest.parse(fromCBOR(bodyCBOR));
    const state = await retrieveStateLocal();

    // if anonymous set identityId to MAX_SAFE_INTEGER
    const identityId = state.originData[origin]?.currentSession?.identityId || Number.MAX_SAFE_INTEGER;

    // for some extra calmness - not applying user-defined salt at this stage    
    let entropyPre: string = await snap.request({
        method: "snap_getEntropy",
        params: {
            version: 1,
            salt: makeEntropySalt('custom', `${origin}\n${identityId}`)
        }
    });

    // apply user-defined salt later as a separate hashing step
    const entropyPreBytes = new Uint8Array([...hexToBytes(entropyPre.slice(2)), ...body.salt]);
    const entropy = await crypto.subtle.digest('SHA-256', entropyPreBytes);

    return new Uint8Array(entropy);
}