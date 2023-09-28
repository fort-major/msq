import { divider, heading, panel, text } from "@metamask/snaps-ui";
import { DEFAULT_ORIGIN_DATA, persistStateLocal, retrieveStateLocal } from "../utils";
import { TOrigin, ZIdentityAddRequest, ZIdentityLoginRequest, ZIdentityLinkRequest, ZIdentityUnlinkRequest, fromCBOR, unreacheable, zodParse, originToHostname } from "@fort-major/masquerade-shared";

export async function protected_handleIdentityAdd(bodyCBOR: string): Promise<true> {
    const body = zodParse(ZIdentityAddRequest, fromCBOR(bodyCBOR));
    const state = await retrieveStateLocal();

    let originData = state.originData[body.toOrigin];

    if (!originData) {
        originData = DEFAULT_ORIGIN_DATA;
    } else {
        originData.identitiesTotal += 1;
    }

    state.originData[body.toOrigin] = originData;
    await persistStateLocal(state);

    return true;
}

export async function protected_handleIdentityLogin(bodyCBOR: string): Promise<true> {
    const body = zodParse(ZIdentityLoginRequest, fromCBOR(bodyCBOR));
    const state = await retrieveStateLocal();
    const timestamp = (new Date()).getTime();

    const originData = state.originData[body.toOrigin];
    if (!originData) { unreacheable('login - no origin data found') }

    originData.currentSession = {
        deriviationOrigin: body.withDeriviationOrigin || body.toOrigin,
        identityId: body.withIdentityId,
        timestampMs: BigInt(timestamp)
    }

    state.originData[body.toOrigin] = originData;
    await persistStateLocal(state);

    return true;
}

export async function handleIdentityLogoutRequest(origin: TOrigin): Promise<boolean> {
    const state = await retrieveStateLocal();
    const originData = state.originData[origin];

    // if we're not authorized anyway - just return true
    if (!originData || !originData.currentSession) {
        return true;
    }

    // otherwise as the user if they really want to log out
    const agreed = await snap.request({
        method: 'snap_dialog',
        params: {
            type: 'confirmation',
            content: panel([
                heading('🔒 Log out request'),
                text(`🌐 **${originToHostname(origin)}** wants you to log out.`),
                divider(),
                text(`You will become anonymous, but **${originToHostname(origin)}** may still track your actions and call canisters on your behalf!`),
                divider(),
                text('**Proceed?** 🚀')
            ])
        }
    });

    // if the user doesn't want to logout - return false
    if (!agreed) {
        return false;
    }

    // otherwise, remove the session and return true
    delete originData.currentSession;
    state.originData[origin] = originData;
    await persistStateLocal(state);

    return true;
}

export async function handleIdentityLinkRequest(bodyCBOR: string, origin: TOrigin): Promise<boolean> {
    const body = zodParse(ZIdentityLinkRequest, fromCBOR(bodyCBOR));
    const state = await retrieveStateLocal();

    const originData = state.originData[body.withOrigin] || DEFAULT_ORIGIN_DATA;

    // if there is already a sharing, just return true as if we did all the rest of the function
    if (originData.links.includes(origin)) {
        return true;
    }

    // otherwise prompt to the user if they want to share
    const agreed = await snap.request({
        method: 'snap_dialog',
        params: {
            type: 'confirmation',
            content: panel([
                heading('🎭 Mask Link Request 🎭'),
                text(`**🌐 ${originToHostname(origin)}** wants you to reveal your masks to 🌐 **${originToHostname(body.withOrigin)}**.`),
                text(`You will be able to log in to **${originToHostname(body.withOrigin)}** using masks you use on **${originToHostname(origin)}**.`),
                heading('🚨 BE CAREFUL! 🚨'),
                text(`**${originToHostname(body.withOrigin)}** will be able to call **${originToHostname(origin)}**'s canisters on your behalf without notice!`),
                text(`Only proceed if **${originToHostname(origin)}** explicitly proposed this action to you.`),
                divider(),
                text('Proceed? 🚀')
            ])
        }
    });

    // if the user didn't agree, return false
    if (!agreed) {
        return false;
    }

    // otherwise update the sharings list and return true
    originData.links.push(origin);
    state.originData[body.withOrigin] = originData;
    await persistStateLocal(state);

    return true;
}

export async function handleIdentityUnlinkRequest(bodyCBOR: string, origin: TOrigin) {
    const body = zodParse(ZIdentityUnlinkRequest, fromCBOR(bodyCBOR));
    const state = await retrieveStateLocal();

    const originData = state.originData[body.withOrigin] || DEFAULT_ORIGIN_DATA;

    // if there is already no sharing with this origin, just return true as if we did all the rest of the function
    if (!originData.links.includes(origin)) {
        return true;
    }

    // otherwise prompt to the user if they want to share
    const agreed = await snap.request({
        method: 'snap_dialog',
        params: {
            type: 'confirmation',
            content: panel([
                heading('🎭 Mask Unlink Request 🎭'),
                text(`**🌐 ${originToHostname(origin)}** wants you to unlink your masks from 🌐 **${originToHostname(body.withOrigin)}**`),
                text(`You will no longer be able to log in to **${originToHostname(body.withOrigin)}** using masks you use on **${originToHostname(origin)}**`),
                divider(),
                text('Proceed? 🚀')
            ])
        }
    });

    // if the user didn't agree, return false
    if (!agreed) {
        return false;
    }

    // otherwise update the sharings list and return true
    const idx = originData.links.findIndex(it => it === body.withOrigin);
    originData.links = originData.links.splice(idx, 1);

    state.originData[body.withOrigin] = originData;
    await persistStateLocal(state);

    return true;
}