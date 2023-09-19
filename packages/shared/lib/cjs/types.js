"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZEntropyGetRequest = exports.ZICRC1TransferRequest = exports.ZICRC1Account = exports.ZIdentityUnshareRequest = exports.ZIdentityShareRequest = exports.ZIdentityLoginRequest = exports.ZAgentReadStateRequest = exports.ZAgentCreateReadStateRequestRequest = exports.ZAgentCallRequest = exports.ZAgentQueryRequest = exports.ZAgentOptions = exports.ZSnapRPCRequest = exports.ZState = exports.ZSession = exports.ZIdentityId = exports.ZTimestamp = exports.ZOrigin = exports.isErr = exports.isOk = exports.ZResult = exports.ZErr = exports.ZOk = exports.ZICRC1Subaccount = exports.ZPrincipal = void 0;
const zod_1 = __importDefault(require("zod"));
exports.ZPrincipal = zod_1.default.custom(it => it._isPrincipal, 'Not a principal');
exports.ZICRC1Subaccount = zod_1.default.instanceof(Uint8Array);
exports.ZOk = zod_1.default.object({ status: zod_1.default.literal("Ok"), payload: zod_1.default.any() });
exports.ZErr = zod_1.default.object({ status: zod_1.default.literal("Err"), code: zod_1.default.number().int(), msg: zod_1.default.string() });
exports.ZResult = zod_1.default.discriminatedUnion('status', [exports.ZOk, exports.ZErr]);
function isOk(res) {
    return res.status === 'Ok';
}
exports.isOk = isOk;
function isErr(res) {
    return res.status === 'Err';
}
exports.isErr = isErr;
// Website origin passed from Metamask 
exports.ZOrigin = zod_1.default.string().url();
// Timestamp in millis
exports.ZTimestamp = zod_1.default.number().int().nonnegative();
// Identity ID
// Just a number that allows user to switch their entire set of identities on all sites + all payment identities
exports.ZIdentityId = zod_1.default.number().int().nonnegative();
exports.ZSession = zod_1.default.object({
    deriviationOrigin: exports.ZOrigin,
    timestampMs: exports.ZTimestamp,
});
// Snap state that is stored in encrypted form on user's device
// TODO: [when vetKeys are ready] - persist it on-chain
exports.ZState = zod_1.default.object({
    // currently chosen identity
    identityId: exports.ZIdentityId,
    // names for all saved identities, indexed by the `identityId`
    // defaults to `IDENTITY_#N`, where N is the identityId
    identities: zod_1.default.array(zod_1.default.string().trim().min(1)),
    // currently logged in sessions
    // TODO: [before Alpha] add a cron task to automatically logout after some time
    sessions: zod_1.default.record(exports.ZOrigin, zod_1.default.optional(exports.ZSession)),
    // origin => origin[] map that defines which sites allowed to which other sites 
    // to use user's identity on their site on another site
    // basically it allows:
    //   1. domain migrations, when users may still use their old identity to log into the new website
    //   2. website integrations, when users may use the same identity while working with both websites
    sharings: zod_1.default.record(exports.ZOrigin, zod_1.default.optional(zod_1.default.array(exports.ZOrigin))),
});
exports.ZSnapRPCRequest = zod_1.default.object({
    method: zod_1.default.string(),
    params: zod_1.default.object({
        body: zod_1.default.string()
    })
});
// Options which are passed from out-agent to in-agent
exports.ZAgentOptions = zod_1.default.object({
    // a host to make canister calls against
    host: zod_1.default.optional(exports.ZOrigin)
});
// -------------- AGENT PROTOCOL RELATED TYPES --------------
exports.ZAgentQueryRequest = exports.ZAgentOptions.extend({
    canisterId: zod_1.default.string().or(exports.ZPrincipal),
    methodName: zod_1.default.string(),
    arg: zod_1.default.instanceof(ArrayBuffer),
});
exports.ZAgentCallRequest = exports.ZAgentQueryRequest.extend({
    effectiveCanisterId: zod_1.default.optional(zod_1.default.string().or(exports.ZPrincipal))
});
exports.ZAgentCreateReadStateRequestRequest = exports.ZAgentOptions.extend({
    paths: zod_1.default.array(zod_1.default.array(zod_1.default.instanceof(ArrayBuffer)))
});
exports.ZAgentReadStateRequest = exports.ZAgentOptions.extend({
    canisterId: zod_1.default.string().or(exports.ZPrincipal),
    paths: zod_1.default.array(zod_1.default.array(zod_1.default.instanceof(ArrayBuffer))),
    request: zod_1.default.optional(zod_1.default.string())
});
// ----------- IDENTITY PROTOCOL RELATED TYPES ---------
exports.ZIdentityLoginRequest = zod_1.default.object({
    toOrigin: exports.ZOrigin,
    withDeriviationOrigin: zod_1.default.optional(exports.ZOrigin),
});
exports.ZIdentityShareRequest = zod_1.default.object({
    shareWithOrigin: exports.ZOrigin,
});
exports.ZIdentityUnshareRequest = zod_1.default.object({
    unshareWithOrigin: exports.ZOrigin,
});
// ----------- ICRC-1 PROTOCOL RELATED TYPES -----------
exports.ZICRC1Account = zod_1.default.object({
    owner: exports.ZPrincipal,
    subaccount: zod_1.default.optional(exports.ZICRC1Subaccount),
});
// TODO: also add timestamp
exports.ZICRC1TransferRequest = exports.ZAgentOptions.extend({
    canisterId: exports.ZPrincipal,
    to: exports.ZICRC1Account,
    memo: zod_1.default.optional(zod_1.default.instanceof(Uint8Array)),
    amount: zod_1.default.bigint(),
});
// ----------- ENTROPY PROTOCOL RELATED TYPES -----------
exports.ZEntropyGetRequest = zod_1.default.object({
    salt: zod_1.default.instanceof(Uint8Array)
});
