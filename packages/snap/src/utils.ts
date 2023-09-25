import { heading, panel, text } from "@metamask/snaps-ui";
import { ErrorCode, IOriginData, IState, SNAP_METHODS, TOrigin, ZState, err, fromCBOR, toCBOR, zodParse } from "@fort-major/ic-snap-shared";

// this is executed during the 'verify' build step process
// when the snap is evaluated in SES
// if it passes during the build step, it will also pass in runtime
if (!process.env.TURBO_SNAP_SITE_ORIGIN) {
    throw new Error(`Bad build: snap site origin is '${process.env.TURBO_SNAP_SITE_ORIGIN}'`);
}

// protected methods are those which could be executed only 
// from the Internet Computer Snap website
const PROTECTED_METHODS = [
    SNAP_METHODS.identity.protected_add,
    SNAP_METHODS.identity.protected_login,
    SNAP_METHODS.state.protected_getOriginData,
];

export function guardMethods(method: string, origin: TOrigin) {
    // let other methods pass
    if (!PROTECTED_METHODS.includes(method)) {
        return;
    }

    // validate origin to be Internet Computer Snap website
    if (origin !== JSON.parse(process.env.TURBO_SNAP_SITE_ORIGIN as string)) {
        return err(ErrorCode.PROTECTED_METHOD, `Method ${method} can only be executed from the Internet Computer Snap website ("${origin}" != ${process.env.TURBO_SNAP_SITE_ORIGIN})`);
    }

    // pass if all good
    return;
}

export const ANONYMOUS_IDENTITY_ID = Number.MAX_SAFE_INTEGER;

export async function retrieveStateLocal(): Promise<IState> {
    let state = await snap.request({
        method: "snap_manageState",
        params: {
            operation: "get"
        }
    });

    if (!state) {
        await persistStateLocal(DEFAULT_STATE);
        return DEFAULT_STATE;
    }

    // @ts-expect-error
    return zodParse(ZState, fromCBOR(state.data));
}

export async function persistStateLocal(state: IState): Promise<void> {
    await snap.request({
        method: "snap_manageState",
        params: {
            operation: "update",
            newState: { data: toCBOR(state) },
        }
    });
}

export async function debugAlert(str: string, origin: string) {
    await snap.request({
        method: 'snap_dialog',
        params: {
            type: 'alert',
            content: panel([
                heading(`Message from ${origin}`),
                text(str)
            ])
        }
    });
}

const DEFAULT_STATE: IState = {
    originData: {}
};

export const DEFAULT_ORIGIN_DATA: IOriginData = {
    identitiesTotal: 1,
    currentSession: undefined,
    links: []
};
