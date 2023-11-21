import { AccountCard } from "../../../../components/account-card";
import { Input } from "../../../../ui-kit/input";
import {
  DEFAULT_PRINCIPAL,
  DEFAULT_SUBACCOUNT,
  getRandomMemo,
  makeAgent,
  makeIcrc1Salt,
  tokensToStr,
} from "../../../../utils";
import { Match, Show, Switch, createSignal, onMount } from "solid-js";
import { Principal } from "@dfinity/principal";
import { Button, EButtonKind } from "../../../../ui-kit/button";
import { EIconKind } from "../../../../ui-kit/icon";
import { createStore } from "solid-js/store";
import { useMasqueradeClient } from "../../../../store/global";
import { debugStringify, hexToBytes } from "@fort-major/masquerade-shared";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import {
  ButtonsWrapper,
  FeeLine,
  FeeLineAmount,
  FeeLineAmountQty,
  FeeLineAmountSymbol,
  FeeLineReason,
  FeeLinesWrapper,
  SendPageMixin,
  SendPopupBg,
  SendPopupBody,
  SendPopupHeading,
  SendPopupWrapper,
} from "./style";
import { useNavigate } from "@solidjs/router";
import { useSendPageProps } from "../../../../store/assets";
import { CabinetPage } from "../../../../ui-kit";
import { ContactUsBtn } from "../../../../components/contact-us-btn";
import { TxnFailPage } from "../../../txn/fail";
import { TxnSuccessPage } from "../../../txn/success";

export interface ISendPageProps {
  accountId: number;
  assetId: string;
  name: string;
  principal: string;
  balance: bigint;
  decimals: number;
  symbol: string;
  fee: bigint;

  onCancel: (result: boolean) => void;
}

export interface ITxnResult {
  success: boolean;
  blockIdx?: bigint | undefined;
  error?: string | undefined;
  totalAmount?: string | undefined;
}

const VALID_HEX_SYMBOLS = "0123456789abcdefABCDEF".split("");
const validateHex = (hex: string) =>
  hex.split("").every((c) => VALID_HEX_SYMBOLS.includes(c)) && hex.length % 2 == 0 ? null : "Invalid hex string";

export function SendPage() {
  const [recipientPrincipal, setRecipientPrincipal] = createSignal<Principal | null>(null);
  const [recipientSubaccount, setRecipientSubaccount] = createSignal<string | null>(null);
  const [memo, setMemo] = createSignal<string | null>(null);
  const [amount, setAmount] = createSignal<bigint>(0n);
  const [correctArr, setCorrectArr] = createStore([false, true, true, false]);
  const [txnResult, setTxnResult] = createSignal<ITxnResult | null>(null);
  const [sending, setSending] = createSignal(false);

  const navigate = useNavigate();
  const [props] = useSendPageProps();

  onMount(() => {
    if (!props()) navigate("/cabinet/my-assets");
  });

  const msq = useMasqueradeClient();

  const isCorrect = () => correctArr.every((it) => it);

  const handleSend = async () => {
    setSending(true);
    document.body.style.cursor = "wait";

    const subaccount = recipientSubaccount() ? hexToBytes(recipientSubaccount()!) : undefined;

    const agreed = await msq()!.showICRC1TransferConfirm({
      requestOrigin: window.location.origin,
      ticker: props()!.symbol,
      from: props()!.principal,
      to: {
        owner: recipientPrincipal()!.toText(),
        subaccount,
      },
      totalAmount: amount() + props()!.fee,
      totalAmountStr: tokensToStr(amount() + props()!.fee, props()!.decimals, true, true),
    });

    if (!agreed) {
      document.body.style.cursor = "unset";
      setSending(false);
      return;
    }

    const identity = await MasqueradeIdentity.create(
      msq()!.getInner(),
      makeIcrc1Salt(props()!.assetId, props()!.accountId),
    );
    const agent = await makeAgent(identity);
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(props()!.assetId) });

    try {
      const blockIdx = await ledger.transfer({
        created_at_time: BigInt(Date.now()) * 1_000_000n,
        to: {
          owner: recipientPrincipal()!,
          subaccount: subaccount ? [subaccount] : [],
        },
        amount: amount(),
        memo: memo() ? hexToBytes(memo()!) : getRandomMemo(),
      });

      setTxnResult({
        success: true,
        blockIdx,
        totalAmount: tokensToStr(amount() + props()!.fee, props()!.decimals, undefined, true),
      });
    } catch (e) {
      let err = debugStringify(e);

      setTxnResult({ success: false, error: err });
    } finally {
      document.body.style.cursor = "unset";
      setSending(false);
    }
  };

  return (
    <CabinetPage class={SendPageMixin}>
      <Show when={props()}>
        <SendPopupBg>
          <SendPopupWrapper>
            <Switch>
              <Match when={txnResult() === null}>
                <SendPopupHeading>Send {props()!.symbol}</SendPopupHeading>
                <SendPopupBody>
                  <AccountCard
                    fullWidth
                    accountId={props()!.accountId}
                    assetId={props()!.assetId}
                    name={props()!.name}
                    principal={props()!.principal}
                    balance={props()!.balance}
                    decimals={props()!.decimals}
                    symbol={props()!.symbol}
                  />
                  <Input
                    label="Principal ID"
                    placeholder={DEFAULT_PRINCIPAL}
                    required
                    disabled={sending()}
                    onErr={(e) => setCorrectArr(0, !e)}
                    KindPrincipal={{ onChange: setRecipientPrincipal }}
                  />
                  <Input
                    label="Subaccount"
                    placeholder={DEFAULT_SUBACCOUNT}
                    disabled={sending()}
                    onErr={(e) => setCorrectArr(1, !e)}
                    KindString={{ onChange: setRecipientSubaccount, validate: validateHex }}
                  />
                  <Input
                    label="Memo"
                    placeholder="Enter your memo"
                    disabled={sending()}
                    onErr={(e) => setCorrectArr(2, !e)}
                    KindString={{ onChange: setMemo, validate: validateHex }}
                  />
                  <FeeLinesWrapper>
                    <Input
                      label="Send Amount"
                      placeholder="1,234.5678"
                      required
                      disabled={sending()}
                      onErr={(e) => setCorrectArr(3, !e)}
                      triggerChangeOnInput
                      KindTokens={{
                        onChange: setAmount,
                        decimals: props()!.decimals,
                        symbol: props()!.symbol,
                        validate: (val) =>
                          val + props()!.fee > props()!.balance
                            ? `Insufficient balance (max ${tokensToStr(
                                props()!.balance - props()!.fee,
                                props()!.decimals,
                              )})`
                            : null,
                      }}
                    />
                    <Show when={amount() !== BigInt(0)}>
                      <FeeLine>
                        <FeeLineAmount>
                          <FeeLineAmountQty>
                            +{tokensToStr(props()!.fee, props()!.decimals, undefined, true)}
                          </FeeLineAmountQty>
                          <FeeLineAmountSymbol>{props()!.symbol}</FeeLineAmountSymbol>
                        </FeeLineAmount>
                        <FeeLineReason>System Fee</FeeLineReason>
                      </FeeLine>
                    </Show>
                  </FeeLinesWrapper>
                  <ButtonsWrapper>
                    <Button
                      disabled={sending()}
                      onClick={() => props()!.onCancel(false)}
                      fullWidth
                      kind={EButtonKind.Additional}
                      text="Cancel"
                    />
                    <Show when={isCorrect()}>
                      <Button
                        disabled={sending()}
                        onClick={handleSend}
                        fullWidth
                        kind={EButtonKind.Primary}
                        text="Continue"
                        icon={sending() ? EIconKind.Loader : EIconKind.ArrowRightUp}
                      />
                    </Show>
                  </ButtonsWrapper>
                </SendPopupBody>
              </Match>

              <Match when={txnResult()!.success}>
                <TxnSuccessPage
                  assetId={props()!.assetId}
                  accountId={props()!.accountId}
                  accountName={props()!.name}
                  accountPrincipal={props()!.principal!}
                  accountBalance={props()!.balance}
                  symbol={props()!.symbol}
                  decimals={props()!.decimals}
                  amount={amount() + props()!.fee}
                  blockId={txnResult()!.blockIdx!}
                  onBack={() => props()!.onCancel(true)}
                />
              </Match>
              <Match when={!txnResult()!.success}>
                <TxnFailPage error={txnResult()?.error!} onBack={() => props()!.onCancel(false)} />
              </Match>
            </Switch>
          </SendPopupWrapper>
        </SendPopupBg>
        <ContactUsBtn />
      </Show>
    </CabinetPage>
  );
}
