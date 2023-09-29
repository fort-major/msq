import { heading, panel, text } from "@metamask/snaps-ui";
import { ErrorCode, SNAP_METHODS, TOrigin, err } from "@fort-major/masquerade-shared";

// this is executed during the 'verify' build step process
// when the snap is evaluated in SES
// if it passes during the build step, it will also pass in runtime
if (!process.env.MSQ_SNAP_SITE_ORIGIN) {
    throw new Error(`Bad build: snap site origin is '${process.env.MSQ_SNAP_SITE_ORIGIN}'`);
}

// protected methods are those which could be executed only 
// from the Internet Computer Snap website
const PROTECTED_METHODS = [
    SNAP_METHODS.identity.protected_add,
    SNAP_METHODS.identity.protected_login,
    SNAP_METHODS.state.protected_getOriginData,
    SNAP_METHODS.icrc1.protected_showTransferConfirm,
];

export function guardMethods(method: string, origin: TOrigin) {
    // let other methods pass
    if (!PROTECTED_METHODS.includes(method)) {
        return;
    }

    // validate origin to be Internet Computer Snap website
    if (origin !== JSON.parse(process.env.MSQ_SNAP_SITE_ORIGIN as string)) {
        return err(ErrorCode.PROTECTED_METHOD, `Method ${method} can only be executed from the Internet Computer Snap website ("${origin}" != ${process.env.MSQ_SNAP_SITE_ORIGIN})`);
    }

    // pass if all good
    return;
}

export const ANONYMOUS_IDENTITY_ID = Number.MAX_SAFE_INTEGER;
