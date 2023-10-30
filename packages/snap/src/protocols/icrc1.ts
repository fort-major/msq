import {
  EStatisticsKind,
  IAssetDataExternal,
  IShowICRC1TransferConfirmRequest,
  TOKENS,
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
        text(`${body.totalAmountStr} ${body.ticker}`),
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

  if (agreed) {
    if (body.ticker in TOKENS) {
      manager.incrementStats(EStatisticsKind.Icrc1Sent, {
        ticker: body.ticker as keyof typeof TOKENS,
        qty: body.totalAmount,
      });
    }
  }

  return Boolean(agreed);
}

export async function protected_handleAddAsset(bodyCBOR: string): Promise<IAssetDataExternal | null> {
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

  const assetDataExternal: IAssetDataExternal = {
    accounts: Object.values(manager.addAsset(body.assetId).accounts),
  };

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
        text("**Proceed?** 🚀"),
      ]),
    },
  });

  if (!agreed) return null;

  manager.incrementStats(EStatisticsKind.Icrc1AccountsCreated);
  const accountName = manager.addAssetAccount(body.assetId);

  return accountName;
}

export async function protected_handleEditAssetAccount(bodyCBOR: string): Promise<void> {
  const body = zodParse(ZICRC1EditAssetAccountRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  manager.editAssetAccount(body.assetId, body.accountId, body.newName);
}
