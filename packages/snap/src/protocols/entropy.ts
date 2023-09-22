import { TOrigin, ZEntropyGetRequest, hexToBytes, fromCBOR, zodParse } from "@fort-major/ic-snap-shared";
import { makeAgent, makeEntropySalt } from "../utils";


export async function handleEntropyGet(bodyCBOR: string, origin: TOrigin): Promise<Uint8Array> {
    const body = zodParse(ZEntropyGetRequest, fromCBOR(bodyCBOR));
    const agent = await makeAgent(origin);

    // for some extra calmness - not applying user-defined salt at this stage    
    let entropyPre: string = await snap.request({
        method: "snap_getEntropy",
        params: {
            version: 1,
            salt: makeEntropySalt('custom', `${origin}\n${agent.identityId}`)
        }
    });

    // apply user-defined salt later as a separate hashing step
    const entropyPreBytes = new Uint8Array([...hexToBytes(entropyPre.slice(2)), ...body.salt]);
    const entropy = await crypto.subtle.digest('SHA-256', entropyPreBytes);

    return new Uint8Array(entropy);
}