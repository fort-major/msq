import {
  IAssetData,
  IShowICRC1TransferConfirmRequest,
  ZICRC1AddAssetAccountRequest,
  ZICRC1AddAssetRequest,
  ZICRC1EditAssetAccountRequest,
  ZShowICRC1TransferConfirmRequest,
  bytesToHex,
  fromCBOR,
  originToHostname,
  zodParse,
} from "@fort-major/masquerade-shared";
import { divider, heading, panel, text } from "@metamask/snaps-ui";
import { StateManager } from "../state";

/**
 * ## Shows a confirmation pop-up for a user to finally commit to the transfer
 *
 * @param bodyCBOR - {@link IShowICRC1TransferConfirmRequest} - CBOR-encoded transfer details
 * @returns - {@link boolean} - whether or not a user confirmed the transfer
 *
 * @category Protected
 * @category Shows Pop-Up
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function protected_handleShowICRC1TransferConfirm(bodyCBOR: string): Promise<boolean> {
  const body = zodParse(ZShowICRC1TransferConfirmRequest, fromCBOR(bodyCBOR));

  const agreed = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading(`💳 Confirm ${body.ticker} Transfer (ICRC-1) 💳`),
        text("**From:**"),
        text(body.from),
        text("**To principal ID:**"),
        text(body.to.owner),
        text("**To subaccount ID:**"),
        text(body.to.subaccount !== undefined ? bytesToHex(body.to.subaccount) : "Default subaccount ID"),
        text("**Total amount:**"),
        text(`${body.totalAmount} ${body.ticker}`),
        text("**Initiator:**"),
        text(`🌐 ${originToHostname(body.requestOrigin)}`),
        divider(),
        heading("🚨 BE CAREFUL! 🚨"),
        text("This action is irreversible. You won't be able to recover your funds!"),
        divider(),
        text("**Proceed?** 🚀"),
      ]),
    },
  });

  const manager = await StateManager.make();
  manager.incrementStats(body.requestOrigin);
  await manager.persist();

  return Boolean(agreed);
}

export async function protected_handleAddAsset(bodyCBOR: string): Promise<IAssetData | null> {
  const body = zodParse(ZICRC1AddAssetRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  const agreed = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading(`🔒 Confirm New ICRC-1 Asset 🔒`),
        text(
          `Are you sure you want to add **${body.name}** (**${body.symbol}**) token to your list of managed assets?`,
        ),
        text(`This will allow you to manage **${body.symbol}** token accounts.`),
        divider(),
        text("**Proceed?** 🚀"),
      ]),
    },
  });

  if (!agreed) return null;

  const assetData = manager.addAsset(body.assetId);

  await manager.persist();

  return assetData;
}

export async function protected_handleAddAssetAccount(bodyCBOR: string): Promise<string | null> {
  const body = zodParse(ZICRC1AddAssetAccountRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  const agreed = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading(`🔒 Confirm New ${body.symbol} Account 🔒`),
        text(`Are you sure you want to create a new **${body.name}** (**${body.symbol}**) token account?`),
        text(`This will allow you to send and receive **${body.symbol}** tokens.`),
        divider(),
        text("**Proceed?** 🚀"),
      ]),
    },
  });

  if (!agreed) return null;

  const accountName = manager.addAssetAccount(body.assetId);

  await manager.persist();

  return accountName;
}

export async function protected_handleEditAssetAccount(bodyCBOR: string): Promise<void> {
  const body = zodParse(ZICRC1EditAssetAccountRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  manager.editAssetAccount(body.assetId, body.accountId, body.newName);

  await manager.persist();
}
