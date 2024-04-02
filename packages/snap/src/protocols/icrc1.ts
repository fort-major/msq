import {
  IAssetDataExternal,
  ZICRC1AddAssetAccountRequest,
  ZICRC1AddAssetRequest,
  ZICRC1EditAssetAccountRequest,
  fromCBOR,
  unreacheable,
  zodParse,
} from "@fort-major/msq-shared";
import { divider, panel } from "@metamask/snaps-sdk";
import { text, heading } from "../utils";
import { StateManager } from "../state";

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
          ...assetNames.map((it) => text(`— **${it}**`)),
          divider(),
          text("**Confirm?** 🚀"),
        ]),
      },
    });

    if (!agreed) return null;
  }

  const assetDataExternal: IAssetDataExternal[] = body.assets.map((it) => ({
    accounts: Object.values(manager.addAsset(it.assetId, it.name, it.symbol, it.fee, it.decimals).accounts),
  }));

  return assetDataExternal;
}

export async function protected_handleAddAssetAccount(bodyCBOR: string): Promise<string | null> {
  const body = zodParse(ZICRC1AddAssetAccountRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  const assetData = manager.getAllAssetData()[body.assetId];

  if (!assetData) {
    unreacheable("attempt to add an account for an unknown asset");
  }

  const agreed = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading(`🔒 Confirm New ${assetData.symbol} Account 🔒`),
        text(`Are you sure you want to create a new **${assetData.name}** (**${assetData.symbol}**) token account?`),
        text(`This will allow you to send and receive **${assetData.symbol}** tokens.`),
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
