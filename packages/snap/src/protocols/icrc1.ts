import {
  IAssetDataExternal,
  IShowICRC1TransferConfirmRequest,
  ZICRC1AddAssetAccountRequest,
  ZICRC1AddAssetRequest,
  ZICRC1EditAssetAccountRequest,
  ZShowICRC1TransferConfirmRequest,
  bytesToHex,
  fromCBOR,
  originToHostname,
  zodParse,
} from "@fort-major/msq-shared";
import { divider, heading, panel, text } from "@metamask/snaps-sdk";
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
        heading(`💳 Confirm ${body.ticker} Transfer 💳`),
        text("**Protocol:**"),
        text("ICRC-1"),
        text("**Initiator:**"),
        text(`🌐 ${originToHostname(body.requestOrigin)}`),
        text("**From:**"),
        text(body.from),
        text("**To principal ID:**"),
        text(body.to.owner),
        text("**To subaccount ID:**"),
        text(body.to.subaccount !== undefined ? bytesToHex(body.to.subaccount) : "Default subaccount ID"),
        text("**Total amount:**"),
        heading(`${body.totalAmountStr} ${body.ticker}`),
        divider(),
        heading("🚨 BE CAREFUL! 🚨"),
        text("This action is irreversible. You won't be able to recover your funds!"),
        divider(),
        text("**Confirm?** 🚀"),
      ]),
    },
  });

  return Boolean(agreed);
}

export async function protected_handleAddAsset(bodyCBOR: string): Promise<IAssetDataExternal[] | null> {
  const body = zodParse(ZICRC1AddAssetRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  const assetNames = body.assets.filter((it) => it.name && it.symbol).map((it) => `${it.name} (${it.symbol})`);

  if (assetNames.length > 0) {
    const agreed = await snap.request({
      method: "snap_dialog",
      params: {
        type: "confirmation",
        content: panel([
          heading(`🔒 Confirm New Assets 🔒`),
          text(`Are you sure you want to add the following tokens to your managed assets list?`),
          ...assetNames.map((it) => text(` - **${it}**`)),
          divider(),
          text("**Confirm?** 🚀"),
        ]),
      },
    });

    if (!agreed) return null;
  }

  const assetDataExternal: IAssetDataExternal[] = body.assets.map((it) => ({
    accounts: Object.values(manager.addAsset(it.assetId).accounts),
  }));

  return assetDataExternal;
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
        text("**Confirm?** 🚀"),
      ]),
    },
  });

  if (!agreed) return null;

  const accountName = manager.addAssetAccount(body.assetId);

  return accountName;
}

export async function protected_handleEditAssetAccount(bodyCBOR: string): Promise<void> {
  const body = zodParse(ZICRC1EditAssetAccountRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  manager.editAssetAccount(body.assetId, body.accountId, body.newName);
}
