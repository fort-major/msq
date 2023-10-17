import { type ZodType, type z } from "zod";
import { type TOrigin } from "./types";

export * from "./types";
export * from "./encoding";

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
    },
    icrc1: {
      showTransferConfirm: "protected_icrc1_showTransferConfirm",
    },
    statistics: {
      get: "protected_statistics_get",
      reset: "protected_statistics_reset",
    },
  },
  public: {
    identity: {
      sign: "public_identity_sign",
      getPublicKey: "public_identity_getPublicKey",

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
