import { IcrcLedgerCanister, IcrcMetadataResponseEntries, IcrcValue } from "@dfinity/ledger";
import { Account } from "@dfinity/ledger/dist/candid/icrc1_ledger";
import { Principal } from "@dfinity/principal";
import { MetaMaskSnapAgent } from "@fort-major/ic-snap-agent";
import { ErrorCode, IICRC1TransferRequest, IWalletSiteICRC1TransferMsg, IWalletSiteICRC1TransferResultMsg, IWalletSiteReadyMsg, ZWalletSiteICRC1TransferMsg, bytesToHex, debugStringify, err, unreacheable } from "@fort-major/ic-snap-shared";
import { createEventSignal } from "@solid-primitives/event-listener";
import { useNavigate } from "@solidjs/router";
import bigDecimal from "js-big-decimal";
import { createEffect, createSignal } from "solid-js";

enum WalletPageState {
    WaitingForTransferRequest,
    ConnectingWallet,
    WaitingForUserInput
}

const referrerOrigin = (new URL(document.referrer)).origin;

export function WalletPage() {
    const [state, setState] = createSignal<WalletPageState>(WalletPageState.WaitingForTransferRequest);
    const [userPrincipal, setUserPrincipal] = createSignal<Principal | null>(null);
    const [agent, setAgent] = createSignal<MetaMaskSnapAgent | null>(null);
    const [actor, setActor] = createSignal<IcrcLedgerCanister | null>(null);
    const [referrerWindow, setReferrerWindow] = createSignal<MessageEventSource | null>(null);
    const [transferRequest, setTransferRequest] = createSignal<IICRC1TransferRequest | null>(null);

    const [tokenName, setTokenName] = createSignal<string | null>(null);
    const [tokenSymbol, setTokenSymbol] = createSignal<string | null>(null);
    const [tokenFee, setTokenFee] = createSignal<bigint | null>(null);
    const [tokenDecimals, setTokenDecimals] = createSignal<bigint | null>(null);
    const [userBalance, setUserBalance] = createSignal<bigint | null>(null);

    const message = createEventSignal(window, "message");
    const navigate = useNavigate();

    const awaitTransferRequest = () => {
        if (state() !== WalletPageState.WaitingForTransferRequest) {
            return;
        }

        const msg = message();

        if (!msg) {
            return;
        }

        if (msg.origin !== referrerOrigin) {
            return;
        }

        // we only expect one single kind of message here
        const transferRequestMsg = ZWalletSiteICRC1TransferMsg.parse(msg.data);

        setTransferRequest(transferRequestMsg.request);

        // if transfer request received, send back ready
        if (!msg.source) {
            err(ErrorCode.UNKOWN, 'No message source found');
        }

        const readyMsg: IWalletSiteReadyMsg = {
            domain: 'internet-computer-metamask-snap',
            type: 'wallet_site_ready'
        };

        msg.source.postMessage(readyMsg, { targetOrigin: referrerOrigin });

        setReferrerWindow(msg.source);

        window.onbeforeunload = () => {
            agent()?._setSiteSession(undefined);

            const failMsg: IWalletSiteICRC1TransferResultMsg = {
                domain: 'internet-computer-metamask-snap',
                type: 'transfer_icrc1_result',
                result: undefined,
            };

            referrerWindow()!.postMessage(failMsg, { targetOrigin: referrerOrigin });
        };

        setState(WalletPageState.ConnectingWallet);
    };

    createEffect(awaitTransferRequest, message());

    const connectWallet = async () => {
        if (state() !== WalletPageState.ConnectingWallet) {
            return;
        }

        const req = transferRequest()!;

        const agent = await MetaMaskSnapAgent.create('http://localhost:8080', 'local:http://localhost:8081');
        await agent.fetchRootKey();
        await agent._setSiteSession({ type: 'canisterId', canisterId: req.canisterId, identityId: 0 });
        setAgent(agent);

        setUserPrincipal(await agent.getPrincipal());

        const actor = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(req.canisterId) });
        setActor(actor);

        const promises: [Promise<Record<string | IcrcMetadataResponseEntries, IcrcValue>>, Promise<bigint>] = [
            actor.metadata({ certified: true }).then(it => it.reduce((prev, cur) => ({ ...prev, [cur[0]]: cur[1] }), {})),
            actor.balance({ certified: true, owner: await agent.getPrincipal() })
        ];

        const [metadata, balance] = await Promise.all(promises);

        setUserBalance(balance);

        const tokenName = (metadata[IcrcMetadataResponseEntries.NAME] as { Text: string }).Text;
        const tokenSymbol = (metadata[IcrcMetadataResponseEntries.SYMBOL] as { Text: string }).Text;
        const tokenFee = (metadata[IcrcMetadataResponseEntries.FEE] as { Nat: bigint }).Nat;
        const tokenDecimals = (metadata[IcrcMetadataResponseEntries.DECIMALS] as { Nat: bigint }).Nat;

        setTokenName(tokenName);
        setTokenSymbol(tokenSymbol);
        setTokenFee(tokenFee);
        setTokenDecimals(tokenDecimals);

        setState(WalletPageState.WaitingForUserInput);
    };

    createEffect(connectWallet, state());

    const onAccept = async () => {
        if (state() !== WalletPageState.WaitingForUserInput) {
            unreacheable();
        }

        const req = transferRequest()!;
        const to: Account = {
            owner: Principal.fromText(req.to.owner),
            subaccount: req.to.subaccount ? [req.to.subaccount] : [],
        };

        const blockIdx = await actor()!.transfer({
            to,
            amount: req.amount,
            memo: req.memo,
            created_at_time: req.created_at_time
        });

        agent()?._setSiteSession(undefined);

        const successMsg: IWalletSiteICRC1TransferResultMsg = {
            domain: 'internet-computer-metamask-snap',
            type: 'transfer_icrc1_result',
            result: blockIdx,
        };

        referrerWindow()!.postMessage(successMsg, { targetOrigin: referrerOrigin });

        window.close();
    };

    const onCancel = async () => {
        agent()?._setSiteSession(undefined);

        const failMsg: IWalletSiteICRC1TransferResultMsg = {
            domain: 'internet-computer-metamask-snap',
            type: 'transfer_icrc1_result',
            result: undefined,
        };

        referrerWindow()!.postMessage(failMsg, { targetOrigin: referrerOrigin });

        window.close();
    };

    const tokenFeeText = () => {
        const fee = tokenFee();
        if (fee === null) return undefined;

        const decimalsForText = new bigDecimal(Math.pow(10, Number(tokenDecimals())));
        const feeForText = new bigDecimal(fee);

        return feeForText.divide(decimalsForText).getPrettyValue();
    };

    const amountText = () => {
        const req = transferRequest();
        if (req === null) return undefined;

        const decimalsForText = new bigDecimal(Math.pow(10, Number(tokenDecimals())));
        const amountForText = new bigDecimal(req.amount);

        return amountForText.divide(decimalsForText).getPrettyValue();
    };

    const totalDeductedText = () => {
        const req = transferRequest();
        if (req === null) return undefined;

        const fee = tokenFee();
        if (fee === null) return undefined;

        const decimalsForText = new bigDecimal(Math.pow(10, Number(tokenDecimals())));
        const feeForText = new bigDecimal(fee);
        const amountForText = new bigDecimal(req.amount);

        return (amountForText.add(feeForText)).divide(decimalsForText).getPrettyValue();
    }

    const balanceText = () => {
        const balance = userBalance();
        if (balance === null) return undefined;

        const decimalsForText = new bigDecimal(Math.pow(10, Number(tokenDecimals())));
        const balanceForText = new bigDecimal(balance);

        return balanceForText.divide(decimalsForText).getPrettyValue();
    };

    const statusText = () => {
        if (state() === WalletPageState.WaitingForTransferRequest) {
            return <p>Waiting for {referrerOrigin}...</p>
        }

        if (state() === WalletPageState.ConnectingWallet) {
            return <p>Connecting your wallet...</p>
        }

        return undefined;
    }

    const body = () => {
        if (state() !== WalletPageState.WaitingForUserInput) return undefined;

        const req = transferRequest()!;
        const enoughFunds = (req.amount + tokenFee()!) <= userBalance()!;

        const memo = req.memo ? (
            <div>
                <span>Memo</span>
                <p>{bytesToHex(req.memo)}</p>
            </div>
        ) : undefined;

        console.log(userPrincipal()?.toText());

        agent()?._getSiteSession().then(console.log);

        return (
            <>
                <h2>{referrerOrigin} wants you to transfer {tokenSymbol()} ({tokenName()})</h2>
                <div>
                    <div>
                        <span>From</span>
                        <input type="text" value={userPrincipal()?.toText()} />
                        <p>Balance: {balanceText()} {tokenSymbol()}</p>
                    </div>
                    <div>
                        <span>To</span>
                        <input type="text" value={req.to.owner} />
                        <input type="text" value={req.to.subaccount ? bytesToHex(req.to.subaccount) : 'Default subaccount'} />
                    </div>
                    <div>
                        <span>Total amount</span>
                        <input type="text" value={`${totalDeductedText()} ${tokenSymbol()}`} />
                        <p>{amountText()} {tokenSymbol()} (requested amount) + {tokenFeeText()} {tokenSymbol()} (canister fee)</p>
                        {!enoughFunds && <p>Not enough funds!</p>}
                    </div>
                    {memo}
                </div>
                <div>
                    <button disabled={!enoughFunds} onClick={onAccept}>Pay</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            </>
        )
    }

    return (
        <main>
            {statusText()}
            {body()}
        </main>
    )
}