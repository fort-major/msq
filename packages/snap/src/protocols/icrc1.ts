import { ErrorCode, SNAP_METHODS, ZICRC1TransferRequest, bytesToHex, debugStringify, err, fromCBOR, zodParse } from "@fort-major/ic-snap-shared";
import { IcrcLedgerCanister, IcrcMetadataResponseEntries, IcrcValue } from "@dfinity/ledger";
import { copyable, divider, heading, panel, text } from "@metamask/snaps-ui";
import bigDecimal from "js-big-decimal";
import { makeAgent } from "../utils";


export async function handleIcrc1TransferRequest(bodyCBOR: string, origin: string): Promise<bigint | null> {
    const body = zodParse(ZICRC1TransferRequest, fromCBOR(bodyCBOR));

    const agent = await makeAgent(SNAP_METHODS.icrc1.requestTransfer, undefined, body.canisterId, body.host, body.rootKey);
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: body.canisterId });

    // fetching metadata and user's balance in parallel
    const promises: [Promise<Record<string | IcrcMetadataResponseEntries, IcrcValue>>, Promise<bigint>] = [
        ledger.metadata({ certified: true }).then(it => it.reduce((prev, cur) => ({ ...prev, [cur[0]]: cur[1] }), {})),
        ledger.balance({ certified: true, owner: await agent.getPrincipal() })
    ];

    const [metadata, balance] = await Promise.all(promises);

    const tokenName = (metadata[IcrcMetadataResponseEntries.NAME] as { Text: string }).Text;
    const tokenSymbol = (metadata[IcrcMetadataResponseEntries.SYMBOL] as { Text: string }).Text;
    const tokenFee = (metadata[IcrcMetadataResponseEntries.FEE] as { Nat: bigint }).Nat;
    const tokenDecimals = (metadata[IcrcMetadataResponseEntries.DECIMALS] as { Nat: bigint }).Nat;

    const toText = text(`${body.to.owner.toText()} ${body.to.subaccount ? ` (subaccount ${bytesToHex(body.to.subaccount)})` : ''}`);
    const memoText = body.memo ? [text('**Memo:**'), text(bytesToHex(body.memo))] : [];

    const decimalsForText = new bigDecimal(Math.pow(10, Number(tokenDecimals)));

    const amountForText = new bigDecimal(body.amount).divide(decimalsForText);
    const feeForText = new bigDecimal(tokenFee).divide(decimalsForText);
    const balanceForText = new bigDecimal(balance).divide(decimalsForText);
    const nextBalanceForText = new bigDecimal(balance - body.amount).divide(decimalsForText);

    if (balance < body.amount) {
        await snap.request({
            method: 'snap_dialog',
            params: {
                type: 'alert',
                content: panel([
                    heading(`${tokenSymbol} transfer request`),
                    text(`${origin} wants you to transfer ${tokenSymbol} (${tokenName})`),
                    heading('Transaction details:'),
                    text('**To:**'),
                    toText,
                    ...memoText,
                    text('**Amount:**'),
                    text(amountForText.getValue()),
                    text('**Fee:**'),
                    text(feeForText.getValue()),
                    text('**Total deduced:**'),
                    text(amountForText.add(feeForText).getValue()),
                    divider(),
                    text('**Current balance:**'),
                    text(balanceForText.getValue()),
                    text('**Next balance:**'),
                    text(nextBalanceForText.getValue()),
                    divider(),
                    text("**Insufficient balance!**"),
                    text(`Deposit more ${tokenSymbol} to this principal`),
                    copyable((await agent.getPrincipal()).toText())
                ])
            }
        });

        return null;
    }

    const agreed = await snap.request({
        method: 'snap_dialog',
        params: {
            type: 'confirmation',
            content: panel([
                heading(`${tokenSymbol} transfer request`),
                text(`${origin} wants you to transfer ${tokenSymbol} (${tokenName})`),
                heading('Transaction details:'),
                text('**To:**'),
                toText,
                ...memoText,
                text('**Amount:**'),
                text(amountForText.getValue()),
                text('**Fee:**'),
                text(feeForText.getValue()),
                text('**Total deduced:**'),
                text(amountForText.add(feeForText).getValue()),
                divider(),
                text('**Current balance:**'),
                text(balanceForText.getValue()),
                text('**Next balance:**'),
                text(nextBalanceForText.getValue()),
                divider(),
                text("Proceed?")
            ])
        }
    });

    if (!agreed) {
        return null;
    }

    const to = {
        owner: body.to.owner,
        subaccount: body.to.subaccount ? [body.to.subaccount] as [Uint8Array] : [] as []
    };

    return ledger.transfer({
        to,
        amount: body.amount,
        fee: tokenFee,
        memo: body.memo
    });
}