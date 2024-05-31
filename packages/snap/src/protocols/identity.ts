import { divider, panel } from "@metamask/snaps-sdk";
import {
  type TOrigin,
  ZIdentityAddRequest,
  ZIdentityLoginRequest,
  ZIdentityLinkRequest,
  ZIdentityUnlinkRequest,
  fromCBOR,
  unreacheable,
  zodParse,
  originToHostname,
  err,
  ErrorCode,
  ZIdentitySignRequest,
  type IIdentityGetLoginOptionsResponse,
  ZIdentityGetLoginOptionsRequest,
  IIdentityAddRequest,
  IIdentityLoginRequest,
  IIdentitySignRequest,
  IIdentityLinkRequest,
  IIdentityUnlinkRequest,
  ZIdentityEditPseudonymRequest,
  IMask,
  ZIdentityStopSessionRequest,
  ZIdentityUnlinkOneRequest,
  toCBOR,
  ZIdentityUnlinkAllRequest,
  ZIdentityGetPublicKeyRequest,
  bytesToHex,
  IHttpAgentRequest,
  IOriginData,
  tokensToStr,
} from "@fort-major/msq-shared";
import { StateManager } from "../state";
import {
  getSignIdentity,
  text,
  heading,
  ONE_HOUR_MS,
  isMsq,
  ICRC1TransferArgs,
  ICRC1_TRANSFER_ARGS_SCHEMA,
  prepareRequest,
  IC_DOMAIN_SEPARATOR,
} from "../utils";
import { concat, requestIdOf } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";

/**
 * ## Creates a new identity (mask) for the user to authorize with on some website
 *
 * @param bodyCBOR - {@link IIdentityAddRequest} - origin of the target website
 * @returns always returns true
 *
 * @category Protected
 * @category Shows Pop-Up
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function protected_handleIdentityAdd(bodyCBOR: string): Promise<IMask | null> {
  const body: IIdentityAddRequest = zodParse(ZIdentityAddRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  const agreed = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("🔒 Confirm Mask Creation 🔒"),
        text(`Are you sure you want to create another mask for **${originToHostname(body.toOrigin)}**?`),
        divider(),
        text("**Confirm?** 🚀"),
      ]),
    },
  });

  if (!agreed) return null;

  const newMask = await manager.addIdentity(body.toOrigin);

  return newMask;
}

/**
 * ## Creates a new session on the provided website
 *
 * @param bodyCBOR - {@link IIdentityLoginRequest}
 * @returns always returns true
 *
 * @category Protected
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function protected_handleIdentityLogin(bodyCBOR: string): Promise<boolean> {
  const body: IIdentityLoginRequest = zodParse(ZIdentityLoginRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  if (body.withLinkedOrigin !== undefined && body.withLinkedOrigin !== body.toOrigin) {
    if (!manager.linkExists(body.withLinkedOrigin, body.toOrigin))
      err(ErrorCode.UNAUTHORIZED, "Unable to login without a link");
  }

  const originData = await manager.getOriginData(body.toOrigin);

  // check if the provided identityId points to an existing identity
  if (body.withLinkedOrigin === undefined) {
    if (!originData.masks[body.withIdentityId]) unreacheable("attempt to log in with an unknown identity");
  } else {
    const linkedOriginData = await manager.getOriginData(body.withLinkedOrigin);

    if (!linkedOriginData.masks[body.withIdentityId]) unreacheable("attempt to log in with an unknown identity");
  }

  // show a consent message to the user
  // don't show for MSQ
  if (!isMsq(body.toOrigin)) {
    // compose a confirmation string, that mentions the linked origin, if there is one
    const withOriginConfirmStr = body.withLinkedOrigin
      ? `, using a mask from **${originToHostname(body.withLinkedOrigin)}**`
      : "";

    // compose a confirmation string, that mentions the identity being used for the session
    const identityPrincipalConfirmStr = (
      await getSignIdentity(body.withLinkedOrigin ? body.withLinkedOrigin : body.toOrigin, body.withIdentityId)
    )
      .getPrincipal()
      .toText();

    // render a confirmation message
    const agreed = await snap.request({
      method: "snap_dialog",
      params: {
        type: "confirmation",
        content: panel([
          heading("🔒 Confirm Authorization 🔒"),
          text(`Are you sure you want to log in to **${originToHostname(body.toOrigin)}**${withOriginConfirmStr}?`),
          divider(),
          text(
            `**${originToHostname(
              body.toOrigin,
            )}** will be able to silently sign messages on behalf of your **${identityPrincipalConfirmStr}** mask!`,
          ),
          divider(),
          text("**Confirm?** 🚀"),
        ]),
      },
    });

    // retreat if disapproved
    if (!agreed) {
      return false;
    }
  }

  // otherwise, start the authorization session
  const timestamp = new Date().getTime();
  originData.currentSession = {
    deriviationOrigin: body.withLinkedOrigin ?? body.toOrigin,
    identityId: body.withIdentityId,
    timestampMs: timestamp,
  };

  manager.setOriginData(body.toOrigin, originData);
  manager.incrementStats({ login: 1 });

  return true;
}

/**
 * ## Returns login options of the user for a particular website
 *
 * These options always contain at least one way for a user to authorize.
 * Includes both: options from the target origin and options from all linked origins
 *
 * @param bodyCBOR - {@link IIdentityGetLoginOptionsRequest}
 * @returns - {@link IIdentityGetLoginOptionsResponse}
 *
 * @category Protected
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function protected_handleIdentityGetLoginOptions(
  bodyCBOR: string,
): Promise<IIdentityGetLoginOptionsResponse> {
  const body = zodParse(ZIdentityGetLoginOptionsRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  const result: IIdentityGetLoginOptionsResponse = [];

  const originData = await manager.getOriginData(body.forOrigin);
  result.push([body.forOrigin, Object.values(originData.masks) as IMask[]]);

  for (const origin of Object.keys(originData.linksFrom)) {
    const linkedOriginData = await manager.getOriginData(origin);

    result.push([origin, Object.values(linkedOriginData.masks) as IMask[]]);
  }

  return result;
}

export async function protected_handleIdentityEditPseudonym(bodyCBOR: string): Promise<void> {
  const body = zodParse(ZIdentityEditPseudonymRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  manager.editPseudonym(body.origin, body.identityId, body.newPseudonym);
}

export function protected_handleIdentityStopSession(bodyCBOR: string): Promise<boolean> {
  const body = zodParse(ZIdentityStopSessionRequest, fromCBOR(bodyCBOR));

  return handleIdentityLogoutRequest(body.origin);
}

export function protected_handleIdentityUnlinkOne(bodyCBOR: string): Promise<boolean> {
  const body = zodParse(ZIdentityUnlinkOneRequest, fromCBOR(bodyCBOR));

  return handleIdentityUnlinkRequest(toCBOR({ withOrigin: body.withOrigin } as IIdentityUnlinkRequest), body.origin);
}

export async function protected_handleIdentityUnlinkAll(bodyCBOR: string): Promise<boolean> {
  const body = zodParse(ZIdentityUnlinkAllRequest, fromCBOR(bodyCBOR));

  const agreed = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("🎭 Mask Unlink Request 🎭"),
        text(`**${originToHostname(body.origin)}** wants you to unlink your masks from **all other websites**.`),
        divider(),
        text(
          `You will no longer be able to log in to **these websites** using masks you use on **${originToHostname(
            body.origin,
          )}**.`,
        ),
        text(
          "You will be logged out from **these websites**, if you're currently logged in using one of the linked masks.",
        ),
        divider(),
        text("**Confirm?** 🚀"),
      ]),
    },
  });

  if (!agreed) return false;

  const manager = await StateManager.make();
  const oldLinks = await manager.unlinkAll(body.origin);

  for (let withOrigin of oldLinks) {
    const targetOriginData = await manager.getOriginData(withOrigin);

    if (targetOriginData.currentSession !== undefined) {
      if (targetOriginData.currentSession.deriviationOrigin === body.origin) {
        targetOriginData.currentSession = undefined;
      }
    }

    manager.setOriginData(withOrigin, targetOriginData);
  }

  manager.incrementStats({ origin_unlink: oldLinks.length });

  return true;
}

/**
 * ## Proposes the user to log out
 *
 * Opens a pop-up window for a user to confirm, whether or not they want to log out from the current website.
 * If the user agrees, then the session is deleted.
 *
 * @param origin - {@link TOrigin}
 * @returns - whether the user did log out
 *
 * @category Shows Pop-Up
 */
export async function handleIdentityLogoutRequest(origin: TOrigin): Promise<boolean> {
  const manager = await StateManager.make();
  const originData = await manager.getOriginData(origin);

  // if we're not authorized anyway - just return true
  if (originData.currentSession === undefined) {
    return true;
  }

  // otherwise as the user if they really want to log out
  const agreed = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("🔒 Log out request 🔒"),
        text(`**${originToHostname(origin)}** wants you to log out.`),
        divider(),
        text(
          `You will become anonymous, but **${originToHostname(
            origin,
          )}** may still track your actions! To prevent that, clean your browser's cache right after logging out.`,
        ),
        divider(),
        text("**Confirm?** 🚀"),
      ]),
    },
  });

  // if the user doesn't want to logout - return false
  if (agreed === false) {
    return false;
  }

  // otherwise, remove the session and return true
  originData.currentSession = undefined;
  manager.setOriginData(origin, originData);

  return true;
}

/**
 * ## Signs an IC http request body with the chosen user key pair
 *
 * Shows a consent message, if on MSQ and an ICRC1 Transfer call is detected.
 * Triggers auth session expiration check and shows a consent message so the user could refresh it.
 *
 * There is a separate Secp256k1 key pair for each user, for each origin, for each user's identity (mask).
 * In other words, key pairs are scoped.
 * Moreover, each key pair can be used to derive more signing key pairs for arbitrary purposes.
 *
 * Only works if the user is logged in.
 *
 * @see {@link handleIdentityGetPublicKey}
 * @see {@link getSignIdentity}
 *
 * @param bodyCBOR - {@link IIdentitySignRequest}
 * @param origin - {@link TOrigin}
 * @returns Secp256k1 signature of the provided payload
 */
export async function handleIdentitySign(bodyCBOR: string, origin: TOrigin): Promise<ArrayBuffer> {
  const body: IIdentitySignRequest = zodParse(ZIdentitySignRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();
  const originData = await manager.getOriginData(origin);

  if (originData.currentSession === undefined) {
    err(ErrorCode.UNAUTHORIZED, "Log in first");
  }

  const identity = await getSignIdentity(
    originData.currentSession.deriviationOrigin,
    originData.currentSession.identityId,
    body.salt,
  );

  const principalId = identity.getPrincipal().toText();

  // those two will trap, if something goes wrong
  await assertSessionFresh(manager, originData, principalId, origin);
  await assertIcrc1TransferAcknowledged(manager, body.request, principalId, origin);

  const request = prepareRequest(body.request);
  const requestId = requestIdOf(request);

  // and sign
  return await identity.sign(concat(IC_DOMAIN_SEPARATOR, requestId));
}

/**
 * ## Returns a public key of the corresponding key pair
 *
 * There is a separate Secp256k1 key pair for each user, for each origin, for each user's identity (mask). In other words, key pairs are scoped.
 * Moreover, each key pair can be used to derive more signing key pairs for arbitrary purposes.
 *
 * Only works if the user is logged in.
 *
 * @see {@link handleIdentitySign}
 * @see {@link getSignIdentity}
 *
 * @param bodyCBOR - {@link IIdentityGetPublicKeyRequest}
 * @param origin - {@link TOrigin}
 * @returns Secp256k1 public key in raw format
 */
export async function handleIdentityGetPublicKey(bodyCBOR: string, origin: TOrigin): Promise<ArrayBuffer> {
  const body = zodParse(ZIdentityGetPublicKeyRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();
  let session = (await manager.getOriginData(origin)).currentSession;

  if (session === undefined) {
    err(ErrorCode.UNAUTHORIZED, "Log in first");
  }

  const identity = await getSignIdentity(session.deriviationOrigin, session.identityId, body.salt);

  return identity.getPublicKey().toRaw();
}

export async function handleIdentityGetPseudonym(origin: TOrigin): Promise<string> {
  const manager = await StateManager.make();
  let session = (await manager.getOriginData(origin)).currentSession;

  if (session === undefined) err(ErrorCode.UNAUTHORIZED, "Log in first");

  const originData = await manager.getOriginData(session.deriviationOrigin);

  return originData.masks[session.identityId]?.pseudonym ?? "Unknown Mister";
}

/**
 * ## Proposes the user to link their masks from this website to another website
 *
 * One can only propose to link masks __from their own__ website, not the other way.
 * This is useful in two scenarios:
 *  - domain name migration - when a website is rebranded and moves to another domain, this functionality allows users to continue using their old identities
 *  - website integration - when two websites want their users to interact with them using the same identities
 *
 * @see {@link handleIdentityUnlinkRequest}
 *
 * @param bodyCBOR - {@link IIdentityLinkRequest}
 * @param origin - {@link TOrigin}
 * @returns whether or not the user allowed linking
 *
 * @category Shows Pop-Up
 */
export async function handleIdentityLinkRequest(bodyCBOR: string, origin: TOrigin): Promise<boolean> {
  const body: IIdentityLinkRequest = zodParse(ZIdentityLinkRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  if (origin === body.withOrigin) {
    err(ErrorCode.INVALID_INPUT, "Unable to link to itself");
  }

  // if there is already a link exists, just return true as if we did all the rest of the function
  if (manager.linkExists(origin, body.withOrigin)) {
    return true;
  }

  // otherwise prompt to the user if they want to share
  const agreed = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("🎭 Mask Link Request 🎭"),
        text(
          `**${originToHostname(origin)}** wants you to reveal your masks to **${originToHostname(body.withOrigin)}**.`,
        ),
        text(
          `You will be able to log in to **${originToHostname(
            body.withOrigin,
          )}** using masks you use on **${originToHostname(origin)}**.`,
        ),
        divider(),
        heading("🚨 BE CAREFUL! 🚨"),
        text(
          `**${originToHostname(body.withOrigin)}** will be able to call **${originToHostname(
            origin,
          )}**'s canisters on your behalf without notice!`,
        ),
        text(
          `Only proceed if **${originToHostname(
            origin,
          )}** recently has updated its domain name and you want to access it using your old masks.`,
        ),
        divider(),
        text("**Confirm?** 🚀"),
      ]),
    },
  });

  // if the user didn't agree, return false
  if (agreed === false) {
    return false;
  }

  // otherwise update the links list and return true
  await manager.link(origin, body.withOrigin);
  manager.incrementStats({ origin_link: 1 });

  return true;
}

/**
 * ## Proposes the user to unlink their identities on this website from another website
 *
 * If the user is logged in to the target website, they will be logged out.
 *
 * @see {@link handleIdentityLinkRequest}
 *
 * @param bodyCBOR - {@link IIdentityUnlinkRequest}
 * @param origin - {@link TOrigin}
 * @returns whether the user agreed to unlink
 *
 * @category Shows Pop-Up
 */
export async function handleIdentityUnlinkRequest(bodyCBOR: string, origin: TOrigin): Promise<boolean> {
  const body: IIdentityUnlinkRequest = zodParse(ZIdentityUnlinkRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  // if there is already no link exists, just return true as if we did all the rest of the function
  if (!manager.linkExists(origin, body.withOrigin)) {
    return true;
  }

  // otherwise prompt to the user if they want to share
  const agreed = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("🎭 Mask Unlink Request 🎭"),
        text(
          `**${originToHostname(origin)}** wants you to unlink your masks from **${originToHostname(
            body.withOrigin,
          )}**.`,
        ),
        divider(),
        text(
          `You will no longer be able to log in to **${originToHostname(
            body.withOrigin,
          )}** using masks you use on **${originToHostname(origin)}**.`,
        ),
        text(
          `You will be logged out from **${originToHostname(
            body.withOrigin,
          )}**, if you're currently logged in using one of the linked masks.`,
        ),
        divider(),
        text("**Confirm?** 🚀"),
      ]),
    },
  });

  // if the user didn't agree, return false
  if (agreed === false) {
    return false;
  }

  // otherwise update the links lists
  await manager.unlink(origin, body.withOrigin);

  // and then try de-authorizing from the target origin
  const targetOriginData = await manager.getOriginData(body.withOrigin);
  if (targetOriginData.currentSession !== undefined) {
    if (targetOriginData.currentSession.deriviationOrigin === origin) {
      targetOriginData.currentSession = undefined;
    }
  }
  manager.setOriginData(body.withOrigin, targetOriginData);
  manager.incrementStats({ origin_unlink: 1 });

  return true;
}

/**
 * ## Returns a list of websites with which the user linked their identities from the current website
 *
 * @param origin - {@link TOrigin}
 * @returns array of {@link TOrigin}
 */
export async function handleIdentityGetLinks(origin: TOrigin): Promise<TOrigin[]> {
  const manager = await StateManager.make();
  const originData = await manager.getOriginData(origin);

  return Object.keys(originData.linksTo);
}

/**
 * Returns `true` if the user is logged in current website
 *
 * @param origin - {@link TOrigin}
 * @returns
 */
export async function handleIdentitySessionExists(origin: TOrigin): Promise<boolean> {
  const manager = await StateManager.make();

  return (await manager.getOriginData(origin)).currentSession !== undefined;
}

/**
 * Checks if the current auth session is expired
 * and if so, prompts the user to explicitly refresh it
 *
 * If the user agrees, refreshes the session, if not - clears the session and traps
 *
 * @param {StateManager} manager
 * @param {IOriginData} originData
 * @param {string} identityPrincipalId
 */
async function assertSessionFresh(
  manager: StateManager,
  originData: IOriginData,
  identityPrincipalId: string,
  origin: string,
) {
  if (!originData.currentSession) {
    unreacheable("Auth session not found");
  }

  const nowMs = Date.now();

  // time-lock the session, so it only lasts for two hours
  // asking for an additional confirmation before proceeding with the signature
  // only works for non-MSQ websites
  if (!isMsq(origin) && nowMs - originData.currentSession.timestampMs > 2 * ONE_HOUR_MS) {
    const agreed = await snap.request({
      method: "snap_dialog",
      params: {
        type: "confirmation",
        content: panel([
          heading("🔒 Confirm Authorization 🔒"),
          text(`Your session at **${originToHostname(origin)}** has expired.`),
          text(
            `Continue allowing **${originToHostname(
              origin,
            )}** to silently sign messages on behalf of your **${identityPrincipalId}** mask?`,
          ),
          divider(),
          text("**Confirm?** 🚀"),
        ]),
      },
    });

    // if disapproved, simply log out and throw an error
    if (!agreed) {
      originData.currentSession = undefined;
      manager.setOriginData(origin, originData);

      // unfortunately, there is no better way to trap and persist the session here
      await StateManager.persist();

      err(ErrorCode.UNAUTHORIZED, "The user has explicitly blocked the request (expired session)");
    }

    // otherwise refresh the session
    originData.currentSession.timestampMs = nowMs;
    manager.setOriginData(origin, originData);
  }
}

/**
 * Protects the MSQ website from possible hack, such as DNS attack
 * Makes users explicitly confirm any signature, when it goes to the "icrc1_transfer" method of any canister
 *
 * Traps, if the token is not found or the user has denied the transfer
 *
 * @param {StateManager} manager
 * @param {IHttpAgentRequest} req
 */
async function assertIcrc1TransferAcknowledged(
  manager: StateManager,
  req: IHttpAgentRequest,
  identityPrincipalId: string,
  origin: string,
) {
  // skip for other websites, skip for non-replicated calls
  if (!isMsq(origin) || req.request_type !== "call") return;

  // panic, if the method name is not what we expect here
  if (req.method_name !== "icrc1_transfer") {
    err(ErrorCode.ICRC1_ERROR, "Only ICRC1 transfers are allowed");
  }

  // check if the token even exists in the wallet
  const assetData = manager.getAllAssetData()[req.canister_id];

  if (!assetData) {
    err(ErrorCode.ICRC1_ERROR, "Asset data not found");
  }

  // for some reason, the candid API expects an ArrayBuffer as an argument,
  // while not providing any way to mark the offset and the lenght of this buffer, if it is not exclusive
  let arg;
  if (req.arg instanceof Uint8Array) {
    arg = new ArrayBuffer(req.arg.byteLength);
    new Uint8Array(arg).set(req.arg);
  } else {
    arg = req.arg;
  }

  // decode the arguments
  // will fail, if not icrc1_transfer args are used
  const [icrc1Request] = IDL.decode([ICRC1_TRANSFER_ARGS_SCHEMA], arg) as unknown as [ICRC1TransferArgs];

  // prompt the user with a consent message
  const totalAmountStr = tokensToStr(icrc1Request.amount + assetData.fee, assetData.decimals, false, true);

  const toSubaccountStr =
    icrc1Request.to.subaccount.length > 0
      ? bytesToHex(icrc1Request.to.subaccount[0] as Uint8Array)
      : "Default subaccount ID";

  const agreed = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading(`💳 Confirm ${assetData.symbol} Transfer 💳`),
        text("**Protocol:**"),
        text("ICRC-1"),
        text("**Initiator:**"),
        text(`🌐 ${originToHostname(origin)}`),
        text("**From:**"),
        text(identityPrincipalId),
        text("**To principal ID:**"),
        text(icrc1Request.to.owner.toText()),
        text("**To subaccount ID:**"),
        text(toSubaccountStr),
        text("**Total amount:**"),
        heading(`${totalAmountStr} ${assetData.symbol}`),
        divider(),
        heading("🚨 BE CAREFUL! 🚨"),
        text("This action is irreversible. You won't be able to recover your funds!"),
        divider(),
        text("**Confirm?** 🚀"),
      ]),
    },
  });

  if (!agreed) {
    err(ErrorCode.ICRC1_ERROR, "The user has explicitly blocked the request (transfer rejected)");
  }

  // pass if agreed
}
