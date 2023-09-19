import { Principal } from "@dfinity/principal";
import z from 'zod';
export declare const ZPrincipal: z.ZodType<Principal, z.ZodTypeDef, Principal>;
export declare const ZICRC1Subaccount: z.ZodType<Uint8Array, z.ZodTypeDef, Uint8Array>;
export declare const ZOk: z.ZodObject<{
    status: z.ZodLiteral<"Ok">;
    payload: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    status: "Ok";
    payload?: any;
}, {
    status: "Ok";
    payload?: any;
}>;
export type IOk = z.infer<typeof ZOk>;
export declare const ZErr: z.ZodObject<{
    status: z.ZodLiteral<"Err">;
    code: z.ZodNumber;
    msg: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: number;
    status: "Err";
    msg: string;
}, {
    code: number;
    status: "Err";
    msg: string;
}>;
export type IErr = z.infer<typeof ZErr>;
export declare const ZResult: z.ZodDiscriminatedUnion<"status", [z.ZodObject<{
    status: z.ZodLiteral<"Ok">;
    payload: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    status: "Ok";
    payload?: any;
}, {
    status: "Ok";
    payload?: any;
}>, z.ZodObject<{
    status: z.ZodLiteral<"Err">;
    code: z.ZodNumber;
    msg: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: number;
    status: "Err";
    msg: string;
}, {
    code: number;
    status: "Err";
    msg: string;
}>]>;
export type IResult = z.infer<typeof ZResult>;
export declare function isOk(res: IResult): res is IOk;
export declare function isErr(res: IResult): res is IErr;
export declare const ZOrigin: z.ZodString;
export type TOrigin = z.infer<typeof ZOrigin>;
export declare const ZTimestamp: z.ZodNumber;
export type TTimestamp = z.infer<typeof ZTimestamp>;
export declare const ZIdentityId: z.ZodNumber;
export type TIdentityId = z.infer<typeof ZIdentityId>;
export declare const ZSession: z.ZodObject<{
    deriviationOrigin: z.ZodString;
    timestampMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    deriviationOrigin: string;
    timestampMs: number;
}, {
    deriviationOrigin: string;
    timestampMs: number;
}>;
export type ISession = z.infer<typeof ZSession>;
export declare const ZState: z.ZodObject<{
    identityId: z.ZodNumber;
    identities: z.ZodArray<z.ZodString, "many">;
    sessions: z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        deriviationOrigin: z.ZodString;
        timestampMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        deriviationOrigin: string;
        timestampMs: number;
    }, {
        deriviationOrigin: string;
        timestampMs: number;
    }>>>;
    sharings: z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    identityId: number;
    identities: string[];
    sessions: Record<string, {
        deriviationOrigin: string;
        timestampMs: number;
    } | undefined>;
    sharings: Record<string, string[] | undefined>;
}, {
    identityId: number;
    identities: string[];
    sessions: Record<string, {
        deriviationOrigin: string;
        timestampMs: number;
    } | undefined>;
    sharings: Record<string, string[] | undefined>;
}>;
export type IState = z.infer<typeof ZState>;
export declare const ZSnapRPCRequest: z.ZodObject<{
    method: z.ZodString;
    params: z.ZodObject<{
        body: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        body: string;
    }, {
        body: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        body: string;
    };
    method: string;
}, {
    params: {
        body: string;
    };
    method: string;
}>;
export type ISnapRpcRequest = z.infer<typeof ZSnapRPCRequest>;
export declare const ZAgentOptions: z.ZodObject<{
    host: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    host?: string | undefined;
}, {
    host?: string | undefined;
}>;
export type IAgentOptions = z.infer<typeof ZAgentOptions>;
export declare const ZAgentQueryRequest: z.ZodObject<{
    host: z.ZodOptional<z.ZodString>;
    canisterId: z.ZodUnion<[z.ZodString, z.ZodType<Principal, z.ZodTypeDef, Principal>]>;
    methodName: z.ZodString;
    arg: z.ZodType<ArrayBuffer, z.ZodTypeDef, ArrayBuffer>;
}, "strip", z.ZodTypeAny, {
    canisterId: (string | Principal) & (string | Principal | undefined);
    methodName: string;
    arg: ArrayBuffer;
    host?: string | undefined;
}, {
    canisterId: (string | Principal) & (string | Principal | undefined);
    methodName: string;
    arg: ArrayBuffer;
    host?: string | undefined;
}>;
export type IAgentQueryRequest = z.infer<typeof ZAgentQueryRequest>;
export declare const ZAgentCallRequest: z.ZodObject<{
    host: z.ZodOptional<z.ZodString>;
    canisterId: z.ZodUnion<[z.ZodString, z.ZodType<Principal, z.ZodTypeDef, Principal>]>;
    methodName: z.ZodString;
    arg: z.ZodType<ArrayBuffer, z.ZodTypeDef, ArrayBuffer>;
    effectiveCanisterId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodType<Principal, z.ZodTypeDef, Principal>]>>;
}, "strip", z.ZodTypeAny, {
    canisterId: (string | Principal) & (string | Principal | undefined);
    methodName: string;
    arg: ArrayBuffer;
    host?: string | undefined;
    effectiveCanisterId?: string | Principal | undefined;
}, {
    canisterId: (string | Principal) & (string | Principal | undefined);
    methodName: string;
    arg: ArrayBuffer;
    host?: string | undefined;
    effectiveCanisterId?: string | Principal | undefined;
}>;
export type IAgentCallRequest = z.infer<typeof ZAgentCallRequest>;
export declare const ZAgentCreateReadStateRequestRequest: z.ZodObject<{
    host: z.ZodOptional<z.ZodString>;
    paths: z.ZodArray<z.ZodArray<z.ZodType<ArrayBuffer, z.ZodTypeDef, ArrayBuffer>, "many">, "many">;
}, "strip", z.ZodTypeAny, {
    paths: ArrayBuffer[][];
    host?: string | undefined;
}, {
    paths: ArrayBuffer[][];
    host?: string | undefined;
}>;
export type IAgentCreateReadStateRequestRequest = z.infer<typeof ZAgentCreateReadStateRequestRequest>;
export declare const ZAgentReadStateRequest: z.ZodObject<{
    host: z.ZodOptional<z.ZodString>;
    canisterId: z.ZodUnion<[z.ZodString, z.ZodType<Principal, z.ZodTypeDef, Principal>]>;
    paths: z.ZodArray<z.ZodArray<z.ZodType<ArrayBuffer, z.ZodTypeDef, ArrayBuffer>, "many">, "many">;
    request: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    canisterId: (string | Principal) & (string | Principal | undefined);
    paths: ArrayBuffer[][];
    host?: string | undefined;
    request?: string | undefined;
}, {
    canisterId: (string | Principal) & (string | Principal | undefined);
    paths: ArrayBuffer[][];
    host?: string | undefined;
    request?: string | undefined;
}>;
export type IAgentReadStateRequest = z.infer<typeof ZAgentReadStateRequest>;
export declare const ZIdentityLoginRequest: z.ZodObject<{
    toOrigin: z.ZodString;
    withDeriviationOrigin: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    toOrigin: string;
    withDeriviationOrigin?: string | undefined;
}, {
    toOrigin: string;
    withDeriviationOrigin?: string | undefined;
}>;
export type IIdentityLoginRequest = z.infer<typeof ZIdentityLoginRequest>;
export declare const ZIdentityShareRequest: z.ZodObject<{
    shareWithOrigin: z.ZodString;
}, "strip", z.ZodTypeAny, {
    shareWithOrigin: string;
}, {
    shareWithOrigin: string;
}>;
export type IIdentityShareRequest = z.infer<typeof ZIdentityShareRequest>;
export declare const ZIdentityUnshareRequest: z.ZodObject<{
    unshareWithOrigin: z.ZodString;
}, "strip", z.ZodTypeAny, {
    unshareWithOrigin: string;
}, {
    unshareWithOrigin: string;
}>;
export type IIdentityUnshareRequest = z.infer<typeof ZIdentityUnshareRequest>;
export declare const ZICRC1Account: z.ZodObject<{
    owner: z.ZodType<Principal, z.ZodTypeDef, Principal>;
    subaccount: z.ZodOptional<z.ZodType<Uint8Array, z.ZodTypeDef, Uint8Array>>;
}, "strip", z.ZodTypeAny, {
    owner: Principal;
    subaccount?: Uint8Array | undefined;
}, {
    owner: Principal;
    subaccount?: Uint8Array | undefined;
}>;
export type IICRC1Account = z.infer<typeof ZICRC1Account>;
export declare const ZICRC1TransferRequest: z.ZodObject<{
    host: z.ZodOptional<z.ZodString>;
    canisterId: z.ZodType<Principal, z.ZodTypeDef, Principal>;
    to: z.ZodObject<{
        owner: z.ZodType<Principal, z.ZodTypeDef, Principal>;
        subaccount: z.ZodOptional<z.ZodType<Uint8Array, z.ZodTypeDef, Uint8Array>>;
    }, "strip", z.ZodTypeAny, {
        owner: Principal;
        subaccount?: Uint8Array | undefined;
    }, {
        owner: Principal;
        subaccount?: Uint8Array | undefined;
    }>;
    memo: z.ZodOptional<z.ZodType<Uint8Array, z.ZodTypeDef, Uint8Array>>;
    amount: z.ZodBigInt;
}, "strip", z.ZodTypeAny, {
    canisterId: Principal;
    to: {
        owner: Principal;
        subaccount?: Uint8Array | undefined;
    };
    amount: bigint;
    host?: string | undefined;
    memo?: Uint8Array | undefined;
}, {
    canisterId: Principal;
    to: {
        owner: Principal;
        subaccount?: Uint8Array | undefined;
    };
    amount: bigint;
    host?: string | undefined;
    memo?: Uint8Array | undefined;
}>;
export type IICRC1TransferRequest = z.infer<typeof ZICRC1TransferRequest>;
export declare const ZEntropyGetRequest: z.ZodObject<{
    salt: z.ZodType<Uint8Array, z.ZodTypeDef, Uint8Array>;
}, "strip", z.ZodTypeAny, {
    salt: Uint8Array;
}, {
    salt: Uint8Array;
}>;
export type IEntropyGetRequest = z.infer<typeof ZEntropyGetRequest>;
