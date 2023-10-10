import {
  ZShowICRC1TransferConfirmRequest,
  bytesToHex,
  fromCBOR,
  originToHostname,
  zodParse,
} from "@fort-major/masquerade-shared";
import { divider, heading, panel, text } from "@metamask/snaps-ui";
import { StateManager } from "../state";

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function protected_handleShowICRC1TransferConfirm(
  bodyCBOR: string,
): Promise<boolean> {
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
        text(
          body.to.subaccount !== undefined
            ? bytesToHex(body.to.subaccount)
            : "Default subaccount ID",
        ),
        text("**Total amount:**"),
        text(`${body.totalAmount} ${body.ticker}`),
        text("**Initiator:**"),
        text(`🌐 ${originToHostname(body.requestOrigin)}`),
        divider(),
        heading("🚨 BE CAREFUL! 🚨"),
        text(
          "This action is irreversible. You won't be able to recover your funds!",
        ),
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
