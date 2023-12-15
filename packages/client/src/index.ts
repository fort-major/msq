export {
  MasqueradeClient,
  type IMasqueradeClientParams,
  type TMasqueradeCreateResult,
  type TMsqCreateOk,
  type TMsqCreateErrInstallMetaMask,
  type TMsqCreateErrUnblockMetaMask,
  type TMsqCreateErrEnableMetaMask,
} from "./client";
export { InternalSnapClient } from "./internal";
export { MasqueradeIdentity } from "./identity";
export { MSQICRC35Client } from "./icrc35-client";
export { ICRC35Connection, openICRC35Window, ICRC35AsyncRequest } from "icrc-35";

// these env variables are inlined during build process
// see ../inline-env-vars.js
export const SNAP_SITE_ORIGIN: string = process.env.MSQ_SNAP_SITE_ORIGIN;
export const SNAP_ID: string = process.env.MSQ_SNAP_ID;
export const SNAP_VERSION: string = process.env.MSQ_SNAP_VERSION;
