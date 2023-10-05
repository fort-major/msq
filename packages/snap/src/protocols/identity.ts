import { divider, heading, panel, text } from "@metamask/snaps-ui";
import { TOrigin, ZIdentityAddRequest, ZIdentityLoginRequest, ZIdentityLinkRequest, ZIdentityUnlinkRequest, fromCBOR, unreacheable, zodParse, originToHostname, err, ErrorCode, strToBytes, ZIdentitySignRequest, IIdentityGetLoginOptionsResponse, ZIdentityGetLoginOptionsRequest, ZIdentityGetPublicKeyRequest, bytesToHex } from "@fort-major/masquerade-shared";
import { StateManager, retrieveStateLocal } from "../state";
import { getSignIdentity, isMasquerade } from "../utils";

export async function protected_handleIdentityAdd(bodyCBOR: string): Promise<true> {
    const body = zodParse(ZIdentityAddRequest, fromCBOR(bodyCBOR));
    const manager = await StateManager.make();

    manager.addIdentity(body.toOrigin);
    manager.incrementStats(body.toOrigin);

    await manager.persist();

    return true;
}

export async function protected_handleIdentityLogin(bodyCBOR: string): Promise<true> {
    const body = zodParse(ZIdentityLoginRequest, fromCBOR(bodyCBOR));
    const manager = await StateManager.make();

    if (!!body.withLinkedOrigin && body.withLinkedOrigin !== body.toOrigin) {
        if (!manager.linkExists(body.withLinkedOrigin, body.toOrigin))
            err(ErrorCode.UNAUTHORIZED, 'Unable to login without a link');
    }

    const originData = manager.getOriginData(body.toOrigin);
    if (originData.identitiesTotal === 0) { unreacheable('login - no origin data found') }

    const timestamp = (new Date()).getTime();
    originData.currentSession = {
        deriviationOrigin: body.withLinkedOrigin || body.toOrigin,
        identityId: body.withIdentityId,
        timestampMs: timestamp
    }

    manager.setOriginData(body.toOrigin, originData);
    manager.incrementStats(body.toOrigin);
    await manager.persist();

    return true;
}

export async function protected_handleIdentityGetLoginOptions(bodyCBOR: string): Promise<IIdentityGetLoginOptionsResponse> {
    const body = zodParse(ZIdentityGetLoginOptionsRequest, fromCBOR(bodyCBOR));
    const manager = await StateManager.make();

    manager.incrementStats(body.forOrigin);

    const result: IIdentityGetLoginOptionsResponse = [];

    const originData = manager.getOriginData(body.forOrigin);

    let options = [];
    for (let i = 0; i < originData.identitiesTotal; i++) {
        const identity = await getSignIdentity(body.forOrigin, i);
        const principal = identity.getPrincipal().toText();

        options.push(principal);
    }

    result.push([body.forOrigin, options]);

    for (let origin of originData.linksFrom) {
        const linkedOriginData = manager.getOriginData(origin);

        let options = [];
        for (let i = 0; i < linkedOriginData.identitiesTotal; i++) {
            const identity = await getSignIdentity(origin, i);
            const principal = identity.getPrincipal().toText();

            options.push(principal);
        }

        result.push([origin, options]);
    }

    await manager.persist();

    return result;
}

export async function handleIdentityLogoutRequest(origin: TOrigin): Promise<boolean> {
    const manager = await StateManager.make();
    const originData = manager.getOriginData(origin);

    // if we're not authorized anyway - just return true
    if (!originData.currentSession) {
        return true;
    }

    // otherwise as the user if they really want to log out
    const agreed = await snap.request({
        method: 'snap_dialog',
        params: {
            type: 'confirmation',
            content: panel([
                heading('🔒 Log out request 🔒'),
                text(`**${originToHostname(origin)}** wants you to log out.`),
                divider(),
                text(`You will become anonymous, but **${originToHostname(origin)}** may still track your actions!`),
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
    originData.currentSession = undefined;
    manager.setOriginData(origin, originData);
    manager.incrementStats(origin);
    await manager.persist();

    return true;
}

export async function handleIdentitySign(bodyCBOR: string, origin: TOrigin): Promise<ArrayBuffer> {
    const body = zodParse(ZIdentitySignRequest, fromCBOR(bodyCBOR));
    const manager = await StateManager.make();
    let session = manager.getOriginData(origin).currentSession;

    if (!session) {
        if (isMasquerade(origin)) {
            session = { deriviationOrigin: origin, identityId: 0, timestampMs: 0 };
        } else {
            err(ErrorCode.UNAUTHORIZED, 'Log in first');
        }
    }

    const identity = await getSignIdentity(session.deriviationOrigin, session.identityId, body.salt);

    manager.incrementStats(origin);
    await manager.persist();

    return identity.sign(body.challenge);
}

export async function handleIdentityGetPublicKey(bodyCBOR: string, origin: TOrigin): Promise<ArrayBuffer> {
    const body = zodParse(ZIdentityGetPublicKeyRequest, fromCBOR(bodyCBOR));
    const manager = await StateManager.make();
    let session = manager.getOriginData(origin).currentSession;

    if (!session) {
        if (isMasquerade(origin)) {
            session = { deriviationOrigin: origin, identityId: 0, timestampMs: 0 };
        } else {
            err(ErrorCode.UNAUTHORIZED, 'Log in first');
        }
    }

    const identity = await getSignIdentity(session.deriviationOrigin, session.identityId, body.salt);

    manager.incrementStats(origin);
    await manager.persist();

    return identity.getPublicKey().toRaw();
}

export async function handleIdentityLinkRequest(bodyCBOR: string, origin: TOrigin): Promise<boolean> {
    const body = zodParse(ZIdentityLinkRequest, fromCBOR(bodyCBOR));
    const manager = await StateManager.make();

    if (origin === body.withOrigin) {
        err(ErrorCode.INVALID_INPUT, 'Unable to link to itself');
    }

    // if there is already a link exists, just return true as if we did all the rest of the function
    if (manager.linkExists(origin, body.withOrigin)) {
        return true;
    }

    // otherwise prompt to the user if they want to share
    const agreed = await snap.request({
        method: 'snap_dialog',
        params: {
            type: 'confirmation',
            content: panel([
                heading('🎭 Mask Link Request 🎭'),
                text(`**${originToHostname(origin)}** wants you to reveal your masks to **${originToHostname(body.withOrigin)}**.`),
                text(`You will be able to log in to **${originToHostname(body.withOrigin)}** using masks you use on **${originToHostname(origin)}**.`),
                divider(),
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

    // otherwise update the links list and return true
    manager.link(origin, body.withOrigin);
    manager.incrementStats(origin);
    await manager.persist();

    return true;
}

export async function handleIdentityUnlinkRequest(bodyCBOR: string, origin: TOrigin) {
    const body = zodParse(ZIdentityUnlinkRequest, fromCBOR(bodyCBOR));
    const manager = await StateManager.make();

    // if there is already no link exists, just return true as if we did all the rest of the function
    if (!manager.linkExists(origin, body.withOrigin)) {
        return true;
    }

    // otherwise prompt to the user if they want to share
    const agreed = await snap.request({
        method: 'snap_dialog',
        params: {
            type: 'confirmation',
            content: panel([
                heading('🎭 Mask Unlink Request 🎭'),
                text(`**${originToHostname(origin)}** wants you to unlink your masks from **${originToHostname(body.withOrigin)}**.`),
                divider(),
                text(`You will no longer be able to log in to **${originToHostname(body.withOrigin)}** using masks you use on **${originToHostname(origin)}**.`),
                text(`You will be logged out from **${originToHostname(body.withOrigin)}**, if you're currently logged in using one of the linked masks.`),
                divider(),
                text('Proceed? 🚀')
            ])
        }
    });

    // if the user didn't agree, return false
    if (!agreed) {
        return false;
    }

    // otherwise update the links lists 
    manager.unlink(origin, body.withOrigin);

    // and then try de-authorizing from the target origin
    const targetOriginData = manager.getOriginData(body.withOrigin);
    if (targetOriginData.currentSession) {
        if (targetOriginData.currentSession.deriviationOrigin === origin) {
            targetOriginData.currentSession = undefined;
        }
    }

    manager.incrementStats(origin);
    await manager.persist();

    return true;
}

export async function handleIdentityGetLinks(origin: TOrigin): Promise<TOrigin[]> {
    const manager = await StateManager.make();
    const originData = manager.getOriginData(origin);

    manager.incrementStats(origin);
    await manager.persist();

    return originData.linksTo;
}