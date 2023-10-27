import { type ZodType, type z } from "zod";
import { type TOrigin } from "./types";

export * from "./types";
export * from "./encoding";
export * from "./avatar";

/**
 * ## Enumerates all available Masquerade snap methods
 *
 * There are two kinds of methods:
 *  - __public__ - these methods can be called from any origin, but all changes and data are scoped to that origin
 *  - __protected__ - these methods can only be called from the Masquerade website
 */
export const SNAP_METHODS = {
  protected: {
    identity: {
      add: "protected_identity_add",
      login: "protected_identity_login",
      getLoginOptions: "protected_identity_getLoginOptions",
      editPseudonym: "protected_identity_editPseudonym",
      stopSession: "protected_identity_stopSession",
      unlinkOne: "protected_identity_unlinkOne",
      unlinkAll: "protected_identity_unlinkAll",
    },
    icrc1: {
      showTransferConfirm: "protected_icrc1_showTransferConfirm",
      addAsset: "protected_icrc1_addAsset",
      addAssetAccount: "protected_icrc1_addAssetAccount",
      editAssetAccount: "protected_icrc1_editAssetAccount",
    },
    statistics: {
      get: "protected_statistics_get",
      reset: "protected_statistics_reset",
    },
    state: {
      getAllOriginData: "protected_state_getAllOriginData",
      getAllAssetData: "protected_state_getAllAssetData",
    },
  },
  public: {
    identity: {
      sign: "public_identity_sign",
      getPublicKey: "public_identity_getPublicKey",

      getPseudonym: "public_identity_getPseudonym",

      requestLogout: "public_identity_requestLogout",
      requestLink: "public_identity_requestLink",
      requestUnlink: "public_identity_requestUnlink",
      getLinks: "public_identity_getLinks",
      sessionExists: "public_identity_sessionExists",
    },
  },
};
export type TProtectedSnapMethodsKind = keyof typeof SNAP_METHODS.protected;

export enum ErrorCode {
  UNKOWN = "MSQ_UNKNOWN",
  INVALID_RPC_METHOD = "MSQ_INVALID_RPC_METHOD",
  INVALID_INPUT = "MSQ_INVALID_INPUT",
  IC_ERROR = "MSQ_IC_ERROR",
  PROTECTED_METHOD = "MSQ_PROTECTED_METHOD",
  ICRC1_ERROR = "MSQ_ICRC1_ERROR",
  METAMASK_ERROR = "MSQ_METAMASK_ERROR",
  UNAUTHORIZED = "MSQ_UNAUTHORIZED",
  SECURITY_VIOLATION = "MSQ_SECURITY_VIOLATION",
}

export function err(code: ErrorCode, msg: string): never {
  throw new Error(`[${code}]: ${msg}`);
}

export function unreacheable(msg?: string): never {
  if (msg === undefined) {
    throw new Error("Unreacheable");
  } else {
    throw new Error(`Unreacheable: ${msg}`);
  }
}

export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// ZodError do not work properly inside a snap, so we rethrow them here
export function zodParse<S extends ZodType>(schema: S, obj: unknown): z.infer<typeof schema> {
  try {
    return schema.parse(obj);
  } catch (e) {
    err(ErrorCode.INVALID_INPUT, JSON.stringify(e));
  }
}

export function originToHostname(origin: TOrigin): string {
  return new URL(origin).hostname;
}

export const TOKENS = {
  ICP: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  ckBTC: "mxzaz-hqaaa-aaaar-qaada-cai",
  CHAT: "2ouva-viaaa-aaaaq-aaamq-cai",
  SONIC: "qbizb-wiaaa-aaaaq-aabwq-cai",
  SNS1: "zfcdd-tqaaa-aaaaq-aaaga-cai",
  OGY: "jwcfb-hyaaa-aaaaj-aac4q-cai",
  MOD: "xsi2v-cyaaa-aaaaq-aabfq-cai",
  GHOST: "4c4fd-caaaa-aaaaq-aaa3a-cai",
  KINIC: "73mez-iiaaa-aaaaq-aaasq-cai",
  HOT: "6rdgd-kyaaa-aaaaq-aaavq-cai",
  CAT: "uf2wh-taaaa-aaaaq-aabna-cai",
};

export const DISCORD_LINK = "https://discord.gg/Z5WMHBReHd";
