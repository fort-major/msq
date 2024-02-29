import { type ZodType, type z } from "zod";
import { type TOrigin } from "./types";
import { debugStringify } from "./encoding";

export * from "./types";
export * from "./encoding";
export * from "./avatar";

/**
 * ## Enumerates all available MSQ snap methods
 *
 * There are two kinds of methods:
 *  - __public__ - these methods can be called from any origin, but all changes and data are scoped to that origin
 *  - __protected__ - these methods can only be called from the MSQ website
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
      increment: "protected_statistics_increment",
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
  UNWRAP_ERROR = "MSQ_UNWRAP_ERROR",
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

function makeTime(): string {
  const now = new Date();

  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  const s = now.getSeconds().toString().padStart(2, "0");

  return `${h}:${m}:${s}`;
}

export function log(...args: any[]) {
  console.log(`[${makeTime()}]`, "<MSQ>", ...args);
}

export function logError(...args: any[]) {
  console.error(`[${makeTime()}]`, "<MSQ>", ...args);
}

// ZodError do not work properly inside a snap, so we rethrow them here
export function zodParse<S extends ZodType>(schema: S, obj: unknown): z.infer<typeof schema> {
  try {
    return schema.parse(obj);
  } catch (e) {
    err(ErrorCode.INVALID_INPUT, debugStringify(e));
  }
}

export function originToHostname(origin: TOrigin): string {
  return new URL(origin).hostname;
}

export const PRE_LISTED_TOKENS: Record<
  string,
  { name: string; assetId: string; logoSrc?: string; chargingAccountId?: string }
> = {
  "ryjl3-tyaaa-aaaaa-aaaba-cai": {
    name: "ICP",
    assetId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
    logoSrc: "https://nns.ic0.app/_app/immutable/assets/icp-rounded.0be14f6b.svg",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "mxzaz-hqaaa-aaaar-qaada-cai": {
    name: "ckBTC",
    assetId: "mxzaz-hqaaa-aaaar-qaada-cai",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "ss2fx-dyaaa-aaaar-qacoq-cai": {
    name: "ckETH",
    assetId: "ss2fx-dyaaa-aaaar-qacoq-cai",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "2ouva-viaaa-aaaaq-aaamq-cai": {
    name: "CHAT",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/3e3x2-xyaaa-aaaaq-aaalq-cai/logo.png",
    assetId: "2ouva-viaaa-aaaaq-aaamq-cai",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "qbizb-wiaaa-aaaaq-aabwq-cai": {
    name: "SONIC",
    assetId: "qbizb-wiaaa-aaaaq-aabwq-cai",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "zfcdd-tqaaa-aaaaq-aaaga-cai": {
    name: "SNS1",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/zxeu2-7aaaa-aaaaq-aaafa-cai/logo.png",
    assetId: "zfcdd-tqaaa-aaaaq-aaaga-cai",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "jwcfb-hyaaa-aaaaj-aac4q-cai": {
    name: "OGY",
    assetId: "jwcfb-hyaaa-aaaaj-aac4q-cai",
    logoSrc: "https://msq.tech/ogy.svg",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "xsi2v-cyaaa-aaaaq-aabfq-cai": {
    name: "MOD",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/x4kx5-ziaaa-aaaaq-aabeq-cai/logo.png",
    assetId: "xsi2v-cyaaa-aaaaq-aabfq-cai",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "4c4fd-caaaa-aaaaq-aaa3a-cai": {
    name: "GHOST",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/4m6il-zqaaa-aaaaq-aaa2a-cai/logo.png",
    assetId: "4c4fd-caaaa-aaaaq-aaa3a-cai",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "73mez-iiaaa-aaaaq-aaasq-cai": {
    name: "KINIC",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/7jkta-eyaaa-aaaaq-aaarq-cai/logo.png",
    assetId: "73mez-iiaaa-aaaaq-aaasq-cai",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "6rdgd-kyaaa-aaaaq-aaavq-cai": {
    name: "HOT",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/67bll-riaaa-aaaaq-aaauq-cai/logo.png",
    assetId: "6rdgd-kyaaa-aaaaq-aaavq-cai",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "uf2wh-taaaa-aaaaq-aabna-cai": {
    name: "CAT",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/uly3p-iqaaa-aaaaq-aabma-cai/logo.png",
    assetId: "uf2wh-taaaa-aaaaq-aabna-cai",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "vtrom-gqaaa-aaaaq-aabia-cai": {
    name: "BOOM DAO",
    assetId: "vtrom-gqaaa-aaaaq-aabia-cai",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/xjngq-yaaaa-aaaaq-aabha-cai/logo.png",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "tyyy3-4aaaa-aaaaq-aab7a-cai": {
    name: "GOLD DAO",
    assetId: "tyyy3-4aaaa-aaaaq-aab7a-cai",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/tw2vt-hqaaa-aaaaq-aab6a-cai/logo.png",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "rffwt-piaaa-aaaaq-aabqq-cai": {
    name: "ICX",
    assetId: "rffwt-piaaa-aaaaq-aabqq-cai",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/u67kc-jyaaa-aaaaq-aabpq-cai/logo.png",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "f54if-eqaaa-aaaaq-aacea-cai": {
    name: "Neutrinite",
    assetId: "f54if-eqaaa-aaaaq-aacea-cai",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/extk7-gaaaa-aaaaq-aacda-cai/logo.png",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "rxdbk-dyaaa-aaaaq-aabtq-cai": {
    name: "Nuance",
    assetId: "rxdbk-dyaaa-aaaaq-aabtq-cai",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/rzbmc-yiaaa-aaaaq-aabsq-cai/logo.png",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "hvgxa-wqaaa-aaaaq-aacia-cai": {
    name: "Sneed",
    assetId: "hvgxa-wqaaa-aaaaq-aacia-cai",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/fp274-iaaaa-aaaaq-aacha-cai/logo.png",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
  "emww2-4yaaa-aaaaq-aacbq-cai": {
    name: "TRAX",
    assetId: "emww2-4yaaa-aaaaq-aacbq-cai",
    logoSrc: "https://3r4gx-wqaaa-aaaaq-aaaia-cai.icp0.io/v1/sns/root/ecu3s-hiaaa-aaaaq-aacaq-cai/logo.png",
    chargingAccountId: "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe",
  },
};

export function calculateMSQFee(assetId: string, amount: bigint): [bigint, string | undefined] {
  const entry = Object.values(PRE_LISTED_TOKENS).find(({ assetId: id }) => id === assetId);
  if (!entry) return [0n, undefined];

  const { assetId: _, chargingAccountId } = entry;
  if (!chargingAccountId) return [0n, undefined];

  const msqFee = amount / 100n;

  return [msqFee, chargingAccountId];
}

export const ICP_INDEX_TOKEN_IDX = ["ryjl3-tyaaa-aaaaa-aaaba-cai", "jwcfb-hyaaa-aaaaj-aac4q-cai"];

export const DISCORD_LINK = "https://discord.gg/RMxyF5Huhs";
// export const METAMASK_LINK = "https://metamask.io/download/";
export const METAMASK_LINK = "https://metamask.io/flask/";
