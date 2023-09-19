import z from 'zod';
export const ZPrincipal = z.custom(it => it._isPrincipal, 'Not a principal');
export const ZICRC1Subaccount = z.instanceof(Uint8Array);
export const ZOk = z.object({ status: z.literal("Ok"), payload: z.any() });
export const ZErr = z.object({ status: z.literal("Err"), code: z.number().int(), msg: z.string() });
export const ZResult = z.discriminatedUnion('status', [ZOk, ZErr]);
export function isOk(res) {
    return res.status === 'Ok';
}
export function isErr(res) {
    return res.status === 'Err';
}
// Website origin passed from Metamask 
export const ZOrigin = z.string().url();
// Timestamp in millis
export const ZTimestamp = z.number().int().nonnegative();
// Identity ID
// Just a number that allows user to switch their entire set of identities on all sites + all payment identities
export const ZIdentityId = z.number().int().nonnegative();
export const ZSession = z.object({
    deriviationOrigin: ZOrigin,
    timestampMs: ZTimestamp,
});
// Snap state that is stored in encrypted form on user's device
// TODO: [when vetKeys are ready] - persist it on-chain
export const ZState = z.object({
    // currently chosen identity
    identityId: ZIdentityId,
    // names for all saved identities, indexed by the `identityId`
    // defaults to `IDENTITY_#N`, where N is the identityId
    identities: z.array(z.string().trim().min(1)),
    // currently logged in sessions
    // TODO: [before Alpha] add a cron task to automatically logout after some time
    sessions: z.record(ZOrigin, z.optional(ZSession)),
    // origin => origin[] map that defines which sites allowed to which other sites 
    // to use user's identity on their site on another site
    // basically it allows:
    //   1. domain migrations, when users may still use their old identity to log into the new website
    //   2. website integrations, when users may use the same identity while working with both websites
    sharings: z.record(ZOrigin, z.optional(z.array(ZOrigin))),
});
export const ZSnapRPCRequest = z.object({
    method: z.string(),
    params: z.object({
        body: z.string()
    })
});
// Options which are passed from out-agent to in-agent
export const ZAgentOptions = z.object({
    // a host to make canister calls against
    host: z.optional(ZOrigin)
});
// -------------- AGENT PROTOCOL RELATED TYPES --------------
export const ZAgentQueryRequest = ZAgentOptions.extend({
    canisterId: z.string().or(ZPrincipal),
    methodName: z.string(),
    arg: z.instanceof(ArrayBuffer),
});
export const ZAgentCallRequest = ZAgentQueryRequest.extend({
    effectiveCanisterId: z.optional(z.string().or(ZPrincipal))
});
export const ZAgentCreateReadStateRequestRequest = ZAgentOptions.extend({
    paths: z.array(z.array(z.instanceof(ArrayBuffer)))
});
export const ZAgentReadStateRequest = ZAgentOptions.extend({
    canisterId: z.string().or(ZPrincipal),
    paths: z.array(z.array(z.instanceof(ArrayBuffer))),
    request: z.optional(z.string())
});
// ----------- IDENTITY PROTOCOL RELATED TYPES ---------
export const ZIdentityLoginRequest = z.object({
    toOrigin: ZOrigin,
    withDeriviationOrigin: z.optional(ZOrigin),
});
export const ZIdentityShareRequest = z.object({
    shareWithOrigin: ZOrigin,
});
export const ZIdentityUnshareRequest = z.object({
    unshareWithOrigin: ZOrigin,
});
// ----------- ICRC-1 PROTOCOL RELATED TYPES -----------
export const ZICRC1Account = z.object({
    owner: ZPrincipal,
    subaccount: z.optional(ZICRC1Subaccount),
});
// TODO: also add timestamp
export const ZICRC1TransferRequest = ZAgentOptions.extend({
    canisterId: ZPrincipal,
    to: ZICRC1Account,
    memo: z.optional(z.instanceof(Uint8Array)),
    amount: z.bigint(),
});
// ----------- ENTROPY PROTOCOL RELATED TYPES -----------
export const ZEntropyGetRequest = z.object({
    salt: z.instanceof(Uint8Array)
});
