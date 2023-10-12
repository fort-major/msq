import z from "zod";

export const ZPrincipalStr = z.string();
export const ZICRC1Subaccount = z.instanceof(Uint8Array);

/**
 * Website origin, for example `https://google.com`
 */
export type TOrigin = z.infer<typeof ZOrigin>;
export const ZOrigin = z.string().url();

/**
 * Timestamp in millis
 */
export type TTimestamp = z.infer<typeof ZTimestamp>;
export const ZTimestamp = z.number().nonnegative();

/**
 * Blob of bytes
 */
export type TBlob = z.infer<typeof ZBlob>;
export const ZBlob = z.instanceof(ArrayBuffer).or(z.instanceof(Uint8Array));

/**
 * Identity ID
 */
export type TIdentityId = z.infer<typeof ZIdentityId>;
export const ZIdentityId = z.number().int().nonnegative();

/**
 * Session object
 */
export type ISession = z.infer<typeof ZSession>;
export const ZSession = z.object({
  /** chosen user identity ID (unique for each website) */
  identityId: ZIdentityId,
  /** an origin used for key deriviation (actual or linked) */
  deriviationOrigin: ZOrigin,
  /** logged in timestamp */
  timestampMs: ZTimestamp,
});

/**
 * Various data for each website the user interacts with
 */
export type IOriginData = z.infer<typeof ZOriginData>;
export const ZOriginData = z.object({
  /** how many identities does a user have on this website */
  identitiesTotal: ZIdentityId,
  /** which websites shared the user's identity with this website */
  linksFrom: z.array(ZOrigin),
  /** to which websites the user shared their identities from this website */
  linksTo: z.array(ZOrigin),
  /** session object, exists if the user is logged in */
  currentSession: z.optional(ZSession),
});

/**
 * Anonimized and squashed activities the user does with Masquerade
 */
export type IStatistics = z.infer<typeof ZStatistics>;
export const ZStatistics = z.object({
  /** when was the last time the user sent the stats to the server */
  lastResetTimestamp: z.number().nonnegative(),
  /** how many activities were performed in any development environment */
  dev: z.number().nonnegative(),
  /** how many activities were performed in any production environment */
  prod: z.number().nonnegative(),
});

/**
 * Snap state that is stored in encrypted form on user's device
 */
export type IState = z.infer<typeof ZState>;
export const ZState = z.object({
  /** version of the state, for future migrations */
  version: z.number().nonnegative(),
  /** user data on each origin */
  originData: z.record(ZOrigin, z.optional(ZOriginData)),
  statistics: ZStatistics,
});

export const ZSnapRPCRequest = z.object({
  method: z.string(),
  params: z.object({
    body: z.string(),
  }),
});
export type ISnapRpcRequest = z.infer<typeof ZSnapRPCRequest>;

// ----------- IDENTITY PROTOCOL RELATED TYPES ---------

export const ZIdentityGetLoginOptionsRequest = z.object({
  forOrigin: ZOrigin,
});
export type IIdentityGetLoginOptionsRequest = z.infer<typeof ZIdentityGetLoginOptionsRequest>;

export const ZIdentityGetLoginOptionsResponse = z.array(z.tuple([ZOrigin, z.array(ZPrincipalStr)]));
export type IIdentityGetLoginOptionsResponse = z.infer<typeof ZIdentityGetLoginOptionsResponse>;

export const ZIdentityAddRequest = z.object({
  toOrigin: ZOrigin,
});
export type IIdentityAddRequest = z.infer<typeof ZIdentityAddRequest>;

export const ZIdentityLoginRequest = z.object({
  /** Origin of the website to log in to */
  toOrigin: ZOrigin,
  /** Identity (mask) id of the user to use */
  withIdentityId: ZIdentityId,
  /** Linked origin, if the user wants to use it to log in */
  withLinkedOrigin: z.optional(ZOrigin),
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

const ZICRC1TransferRequest = z.object({
  canisterId: ZPrincipalStr,
  to: ZICRC1Account,
  amount: z.bigint(),
  memo: z.optional(z.instanceof(Uint8Array)),
  createdAt: z.optional(z.bigint()),
});
export type IICRC1TransferRequest = z.infer<typeof ZICRC1TransferRequest>;

export const ZShowICRC1TransferConfirmRequest = z.object({
  requestOrigin: ZOrigin,
  from: ZPrincipalStr,
  to: ZICRC1Account,
  totalAmount: z.string(),
  ticker: z.string(),
});
export type IShowICRC1TransferConfirmRequest = z.infer<typeof ZShowICRC1TransferConfirmRequest>;

// ---------- MESSAGE TYPES ------------------------------

const ZMsgDomain = z.literal("internet-computer-metamask-snap");

export const ZLoginSiteReadyMsg = z.object({
  domain: ZMsgDomain,
  type: z.literal("login_site_ready"),
});
export type ILoginSiteReadyMsg = z.infer<typeof ZLoginSiteReadyMsg>;

export const ZLoginResultMsg = z.object({
  domain: ZMsgDomain,
  type: z.literal("login_result"),
  result: z.boolean(),
});
export type ILoginResultMsg = z.infer<typeof ZLoginResultMsg>;

export const ZLoginSiteMsg = z.discriminatedUnion("type", [ZLoginSiteReadyMsg, ZLoginResultMsg]);
export type ILoginSiteMsg = z.infer<typeof ZLoginSiteMsg>;

export const ZLoginRequestMsg = z.object({
  domain: ZMsgDomain,
  type: z.literal("login_request"),
});
export type ILoginRequestMsg = z.infer<typeof ZLoginRequestMsg>;

export const ZWalletSiteICRC1TransferMsg = z.object({
  domain: ZMsgDomain,
  type: z.literal("transfer_icrc1_request"),
  request: ZICRC1TransferRequest,
});
export type IWalletSiteICRC1TransferMsg = z.infer<typeof ZWalletSiteICRC1TransferMsg>;

export const ZWalletSiteReadyMsg = z.object({
  domain: ZMsgDomain,
  type: z.literal("wallet_site_ready"),
});
export type IWalletSiteReadyMsg = z.infer<typeof ZWalletSiteReadyMsg>;

export const ZWalletSiteICRC1TransferResultMsg = z.object({
  domain: ZMsgDomain,
  type: z.literal("transfer_icrc1_result"),
  result: z.optional(z.bigint()),
});
export type IWalletSiteICRC1TransferResultMsg = z.infer<typeof ZWalletSiteICRC1TransferResultMsg>;

export const ZWalletSiteMsg = z.discriminatedUnion("type", [ZWalletSiteReadyMsg, ZWalletSiteICRC1TransferResultMsg]);
export type IWalletSiteMsg = z.infer<typeof ZWalletSiteMsg>;
