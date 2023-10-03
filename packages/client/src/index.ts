export { MasqueradeClient as SnapClient, IMasqueradeClientParams as ISnapClientParams } from './client';

// these env variables are inlined during build process
// see ../inline-env-vars.js
export const SNAP_SITE_ORIGIN: string = process.env.MSQ_SNAP_SITE_ORIGIN;
export const SNAP_ID: string = process.env.MSQ_SNAP_ID;
export const SNAP_VERSION: string = process.env.MSQ_SNAP_VERSION;