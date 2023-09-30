import { Principal } from "@dfinity/principal";
import z from 'zod';

export const ZPrincipalStr = z.string();
export const ZICRC1Subaccount = z.instanceof(Uint8Array);

// Website origin passed from Metamask 
export const ZOrigin = z.string().url();
export type TOrigin = z.infer<typeof ZOrigin>;


// Timestamp in millis
export const ZTimestamp = z.bigint();
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


export const ZOriginData = z.object({
    // how many identities does a user have on this website
    identitiesTotal: ZIdentityId,
    // which websites shared the user's identity with this website
    // basically it allows:
    //   1. domain migrations, when users may still use their old identity to log into the new website
    //   2. website integrations, when users may use the same identity while working with both websites
    linksFrom: z.array(ZOrigin),
    linksTo: z.array(ZOrigin),
    // session object, exists if the user is logged in
    // TODO: should we purge this periodically? Metamask already has a lock screen with a password and stuff
    currentSession: z.optional(ZSession)
});
export type IOriginData = z.infer<typeof ZOriginData>;


// Snap state that is stored in encrypted form on user's device
// TODO: [when vetKeys are ready] - persist it on-chain
export const ZState = z.object({
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


// -------------- STATE PROTOCOL RELATED TYPES --------------

export const ZStateGetOriginDataRequest = z.object({
    origin: ZOrigin
});
export type IStateGetOriginDataRequest = z.infer<typeof ZStateGetOriginDataRequest>;

// ----------- IDENTITY PROTOCOL RELATED TYPES ---------

export const ZIdentityGetLoginOptionsRequest = z.object({
    forOrigin: ZOrigin
});
export type IIdentityGetLoginOptionsRequest = z.infer<typeof ZIdentityGetLoginOptionsRequest>;

export const ZIdentityGetLoginOptionsResponse = z.array(z.tuple([ZOrigin, z.array(ZPrincipalStr)]));
export type IIdentityGetLoginOptionsResponse = z.infer<typeof ZIdentityGetLoginOptionsResponse>;

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


export const ZIdentitySignRequest = z.object({
    challenge: ZBlob,
    salt: z.optional(z.instanceof(Uint8Array)),
});
export type IIdentitySignRequest = z.infer<typeof ZIdentitySignRequest>;

export const ZIdentityGetPublicKeyRequest = z.object({
    salt: z.optional(z.instanceof(Uint8Array)),
});
export type IIdentityGetPublicKeyRequest = z.infer<typeof ZIdentityGetPublicKeyRequest>;

export const ZIdentityLinkRequest = z.object({
    withOrigin: ZOrigin,
});
export type IIdentityLinkRequest = z.infer<typeof ZIdentityLinkRequest>;


export const ZIdentityUnlinkRequest = z.object({
    withOrigin: ZOrigin,
});
export type IIdentityUnlinkRequest = z.infer<typeof ZIdentityUnlinkRequest>;

// ----------- ICRC1 PROTOCOL RELATED TYPES -------------

export const ZICRC1Account = z.object({
    owner: ZPrincipalStr,
    subaccount: z.optional(ZICRC1Subaccount),
});
export type IICRC1Account = z.infer<typeof ZICRC1Account>;

// TODO: also add timestamp
const ZICRC1TransferRequest = z.object({
    canisterId: ZPrincipalStr,
    to: ZICRC1Account,
    amount: z.bigint(),
    memo: z.optional(z.instanceof(Uint8Array)),
    created_at_time: z.optional(ZTimestamp),
});
export type IICRC1TransferRequest = z.infer<typeof ZICRC1TransferRequest>;

export const ZShowICRC1TransferConfirmRequest = z.object({
    from: ZPrincipalStr,
    to: ZICRC1Account,
    totalAmount: z.string(),
    ticker: z.string(),
});
export type IShowICRC1TransferConfirmRequest = z.infer<typeof ZShowICRC1TransferConfirmRequest>;

// ---------- MESSAGE TYPES ------------------------------

const ZMsgDomain = z.literal('internet-computer-metamask-snap');

export const ZLoginSiteReadyMsg = z.object({
    domain: ZMsgDomain,
    type: z.literal('login_site_ready')
});
export type ILoginSiteReadyMsg = z.infer<typeof ZLoginSiteReadyMsg>;


export const ZLoginResultMsg = z.object({
    domain: ZMsgDomain,
    type: z.literal('login_result'),
    result: z.boolean(),
});
export type ILoginResultMsg = z.infer<typeof ZLoginResultMsg>;


export const ZLoginSiteMsg = z.discriminatedUnion('type', [ZLoginSiteReadyMsg, ZLoginResultMsg]);
export type ILoginSiteMsg = z.infer<typeof ZLoginSiteMsg>;


export const ZLoginRequestMsg = z.object({
    domain: ZMsgDomain,
    type: z.literal('login_request')
});
export type ILoginRequestMsg = z.infer<typeof ZLoginRequestMsg>;

export const ZWalletSiteICRC1TransferMsg = z.object({
    domain: ZMsgDomain,
    type: z.literal('transfer_icrc1_request'),
    request: ZICRC1TransferRequest,
});
export type IWalletSiteICRC1TransferMsg = z.infer<typeof ZWalletSiteICRC1TransferMsg>;

export const ZWalletSiteReadyMsg = z.object({
    domain: ZMsgDomain,
    type: z.literal('wallet_site_ready')
});
export type IWalletSiteReadyMsg = z.infer<typeof ZWalletSiteReadyMsg>;

export const ZWalletSiteICRC1TransferResultMsg = z.object({
    domain: ZMsgDomain,
    type: z.literal('transfer_icrc1_result'),
    result: z.optional(z.bigint()),
});
export type IWalletSiteICRC1TransferResultMsg = z.infer<typeof ZWalletSiteICRC1TransferResultMsg>;

export const ZWalletSiteMsg = z.discriminatedUnion('type', [ZWalletSiteReadyMsg, ZWalletSiteICRC1TransferResultMsg]);
export type IWalletSiteMsg = z.infer<typeof ZWalletSiteMsg>;