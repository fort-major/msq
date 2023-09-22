import { Principal } from "@dfinity/principal";
import z from 'zod';

export const ZPrincipal = z.custom<Principal>(it => (it as Principal)._isPrincipal, 'Not a principal');
export const ZICRC1Subaccount = z.instanceof(Uint8Array);


// Website origin passed from Metamask 
export const ZOrigin = z.string().url();
export type TOrigin = z.infer<typeof ZOrigin>;


// Timestamp in millis
export const ZTimestamp = z.number().int().nonnegative();
export type TTimestamp = z.infer<typeof ZTimestamp>;


// Blob of bytes
export const ZBlob = z.instanceof(ArrayBuffer).or(z.instanceof(Uint8Array));
export type TBlob = z.infer<typeof ZBlob>;

// Identity ID
// Just a number that allows user to switch their entire set of identities on all sites + all payment identities
export const ZIdentityId = z.number().int().nonnegative();
export type TIdentityId = z.infer<typeof ZIdentityId>;


export const ZSession = z.object({
    identityId: ZIdentityId,
    deriviationOrigin: ZOrigin,
    timestampMs: ZTimestamp,
});
export type ISession = z.infer<typeof ZSession>;


const ZSiteSessionOrigin = z.object({
    type: z.literal('origin'),
    origin: ZOrigin,
    identityId: ZIdentityId,
});

const ZSiteSessionCanisterId = z.object({
    type: z.literal('canisterId'),
    canisterId: ZPrincipal,
    identityId: ZIdentityId
});

export const ZSiteSession = z.discriminatedUnion('type', [ZSiteSessionOrigin, ZSiteSessionCanisterId]);
export type ISiteSession = z.infer<typeof ZSiteSession>;

export const ZOriginData = z.object({
    // how many identities does a user have on this website
    identitiesTotal: ZIdentityId,
    // which websites shared the user's identity with this website
    // basically it allows:
    //   1. domain migrations, when users may still use their old identity to log into the new website
    //   2. website integrations, when users may use the same identity while working with both websites
    links: z.array(ZOrigin),
    // session object, exists if the user is logged in
    // TODO: should we purge this periodically? Metamask already has a lock screen with a password and stuff
    currentSession: z.optional(ZSession)
});
export type IOriginData = z.infer<typeof ZOriginData>;


// Snap state that is stored in encrypted form on user's device
// TODO: [when vetKeys are ready] - persist it on-chain
export const ZState = z.object({
    // session that is currently used on Internet Computer Snap website
    siteSession: z.optional(ZSiteSession),
    // other origins data
    originData: z.record(ZOrigin, z.optional(ZOriginData)),
});
export type IState = z.infer<typeof ZState>;


export const ZSnapRPCRequest = z.object({
    method: z.string(),
    params: z.object({
        body: z.string()
    })
});
export type ISnapRpcRequest = z.infer<typeof ZSnapRPCRequest>;


// Options which are passed from out-agent to in-agent
export const ZAgentOptions = z.object({
    // a host to make canister calls against
    host: z.optional(ZOrigin),
    rootKey: z.optional(ZBlob),
});
export type IAgentOptions = z.infer<typeof ZAgentOptions>;


// -------------- STATE PROTOCOL RELATED TYPES --------------

export const ZStateGetOriginDataRequest = z.object({
    origin: ZOrigin
});
export type IStateGetOriginDataRequest = z.infer<typeof ZStateGetOriginDataRequest>;


// -------------- AGENT PROTOCOL RELATED TYPES --------------

export const ZAgentQueryRequest = ZAgentOptions.extend({
    canisterId: z.string().or(ZPrincipal),
    methodName: z.string(),
    arg: ZBlob,
});
export type IAgentQueryRequest = z.infer<typeof ZAgentQueryRequest>;


export const ZAgentCallRequest = ZAgentQueryRequest.extend({
    effectiveCanisterId: z.optional(z.string().or(ZPrincipal))
});
export type IAgentCallRequest = z.infer<typeof ZAgentCallRequest>;


export const ZAgentCreateReadStateRequestRequest = ZAgentOptions.extend({
    paths: z.array(z.array(ZBlob))
});
export type IAgentCreateReadStateRequestRequest = z.infer<typeof ZAgentCreateReadStateRequestRequest>;


export const ZAgentReadStateRequest = ZAgentOptions.extend({
    canisterId: z.string().or(ZPrincipal),
    paths: z.array(z.array(ZBlob)),
    request: z.optional(z.any())
});
export type IAgentReadStateRequest = z.infer<typeof ZAgentReadStateRequest>;


export const ZAgentGetUrlPrincipalAtRequest = z.object({
    atOrigin: ZOrigin,
    identityId: ZIdentityId,
});
export type IAgentGetUrlPrincipalAtRequest = z.infer<typeof ZAgentGetUrlPrincipalAtRequest>;


// ----------- IDENTITY PROTOCOL RELATED TYPES ---------

export const ZIdentityAddRequest = z.object({
    toOrigin: ZOrigin
});
export type IIdentityAddRequest = z.infer<typeof ZIdentityAddRequest>;


export const ZIdentityLoginRequest = z.object({
    toOrigin: ZOrigin,
    withIdentityId: ZIdentityId,
    withDeriviationOrigin: z.optional(ZOrigin),
});
export type IIdentityLoginRequest = z.infer<typeof ZIdentityLoginRequest>;


export const ZIdentityLinkRequest = z.object({
    withOrigin: ZOrigin,
});
export type IIdentityLinkRequest = z.infer<typeof ZIdentityLinkRequest>;


export const ZIdentityUnlinkRequest = z.object({
    withOrigin: ZOrigin,
});
export type IIdentityUnlinkRequest = z.infer<typeof ZIdentityUnlinkRequest>;


// ----------- ICRC-1 PROTOCOL RELATED TYPES -----------

export const ZICRC1Account = z.object({
    owner: ZPrincipal,
    subaccount: z.optional(ZICRC1Subaccount),
});
export type IICRC1Account = z.infer<typeof ZICRC1Account>;


// TODO: also add timestamp
export const ZICRC1TransferRequest = ZAgentOptions.extend({
    canisterId: ZPrincipal,
    to: ZICRC1Account,
    memo: z.optional(z.instanceof(Uint8Array)),
    amount: z.bigint(),
});
export type IICRC1TransferRequest = z.infer<typeof ZICRC1TransferRequest>;

// ----------- ENTROPY PROTOCOL RELATED TYPES -----------

export const ZEntropyGetRequest = z.object({
    salt: z.instanceof(Uint8Array)
});
export type IEntropyGetRequest = z.infer<typeof ZEntropyGetRequest>;

// ---------- MESSAGE TYPES ------------------------------

export const ZLoginSiteReadyMsg = z.object({
    domain: z.literal('internet-computer-metamask-snap'),
    type: z.literal('login_site_ready')
});
export type ILoginSiteReadyMsg = z.infer<typeof ZLoginSiteReadyMsg>;


export const ZLoginResultMsg = z.object({
    domain: z.literal('internet-computer-metamask-snap'),
    type: z.literal('login_result'),
    result: z.boolean(),
});
export type ILoginResultMsg = z.infer<typeof ZLoginResultMsg>;


export const ZLoginSiteMsg = z.discriminatedUnion('type', [ZLoginSiteReadyMsg, ZLoginResultMsg]);
export type ILoginSiteMsg = z.infer<typeof ZLoginSiteMsg>;


export const ZLoginRequestMsg = z.object({
    domain: z.literal('internet-computer-metamask-snap'),
    type: z.literal('login_request')
});
export type ILoginRequestMsg = z.infer<typeof ZLoginRequestMsg>;