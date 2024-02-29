export const SNAP_VERSION: string = "^0.2.10";

export {
  MsqClient,
  type IMsqClientParams,
  type TMsqCreateResult,
  type TMsqCreateOk,
  type TMsqCreateErrInstallMetaMask,
  type TMsqCreateErrUnblockMetaMask,
  type TMsqCreateErrEnableMetaMask,
} from "./client";
export { InternalSnapClient } from "./internal";
export { MsqIdentity } from "./identity";
export { MSQICRC35Client, LOGIN_ROUTE, PAY_ROUTE } from "./icrc35-client";
export { ICRC35Connection, openICRC35Window, ICRC35AsyncRequest } from "icrc-35";

// these env variables are inlined during build process
// see ../inline-env-vars.js
export const SNAP_SITE_ORIGIN: string = process.env.MSQ_SNAP_SITE_ORIGIN;
export const SNAP_ID: string = process.env.MSQ_SNAP_ID;
