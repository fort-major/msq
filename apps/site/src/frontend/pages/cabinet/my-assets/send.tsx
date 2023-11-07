import { styled } from "solid-styled-components";
import { AccountCard } from "../../../components/account-card";
import { BAR_HEIGHT, COLOR_BLACK, COLOR_GRAY_140, COLOR_GRAY_190, COLOR_WHITE, HEADER_HEIGHT } from "../../../ui-kit";
import { Input } from "../../../ui-kit/input";
import { DEFAULT_PRINCIPAL, DEFAULT_SUBACCOUNT, makeAgent, tokensToStr } from "../../../utils";
import { Match, Show, Switch, createSignal } from "solid-js";
import { Principal } from "@dfinity/principal";
import { Portal } from "solid-js/web";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { createStore } from "solid-js/store";
import { useMasqueradeClient } from "../../../store/global";
import { debugStringify, hexToBytes } from "@fort-major/masquerade-shared";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";
import { makeIcrc1Salt } from "../../../store/cabinet";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { Accent, ErrorText } from "../../../components/typography/style";

export interface ISendPopupProps {
  accountId: number;
  assetId: string;
  name: string;
  principal: string;
  balance: bigint;
  decimals: number;
  symbol: string;
  fee: bigint;

  onCancel?: (result: boolean) => void;
}

interface ITxnResult {
  success: boolean;
  blockIdx?: bigint | undefined;
  error?: string | undefined;
  totalAmount?: string | undefined;
}

const VALID_HEX_SYMBOLS = "0123456789abcdefABCDEF".split("");
const validateHex = (hex: string) =>
  hex.split("").every((c) => VALID_HEX_SYMBOLS.includes(c)) && hex.length % 2 == 0 ? null : "Invalid hex string";

export function SendPopup(props: ISendPopupProps) {
  const [recipientPrincipal, setRecipientPrincipal] = createSignal<Principal | null>(null);
  const [recipientSubaccount, setRecipientSubaccount] = createSignal<string | null>(null);
  const [memo, setMemo] = createSignal<string | null>(null);
  const [amount, setAmount] = createSignal<bigint>(0n);
  const [correctArr, setCorrectArr] = createStore([false, true, true, false]);
  const [txnResult, setTxnResult] = createSignal<ITxnResult | null>(null);
  const [sending, setSending] = createSignal(false);

  const msq = useMasqueradeClient();

  const isCorrect = () => correctArr.every((it) => it);

  const handleSend = async () => {
    setSending(true);

    const subaccount = recipientSubaccount() ? hexToBytes(recipientSubaccount()!) : undefined;

    const agreed = await msq()!.showICRC1TransferConfirm({
      requestOrigin: window.location.origin,
      ticker: props.symbol,
      from: props.principal,
      to: {
        owner: recipientPrincipal()!.toText(),
        subaccount,
      },
      totalAmount: amount() + props.fee,
      totalAmountStr: tokensToStr(amount() + props.fee, props.decimals, true),
    });

    if (!agreed) {
      setSending(false);
      return;
    }

    const identity = await MasqueradeIdentity.create(msq()!.getInner(), makeIcrc1Salt(props.assetId, props.accountId));
    const agent = await makeAgent(identity);
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(props.assetId) });

    try {
      const blockIdx = await ledger.transfer({
        created_at_time: BigInt(Date.now()) * 1_000_000n,
        to: {
          owner: recipientPrincipal()!,
          subaccount: subaccount ? [subaccount] : [],
        },
        amount: amount(),
        memo: memo() ? hexToBytes(memo()!) : undefined,
      });

      setTxnResult({
        success: true,
        blockIdx,
        totalAmount: tokensToStr(amount() + props.fee, props.decimals),
      });
    } catch (e) {
      let err = debugStringify(e);

      setTxnResult({ success: false, error: err });
    } finally {
      setSending(false);
    }
  };

  return (
    <Portal mount={document.getElementById("portal")!}>
      <SendPopupBg center={txnResult() !== null}>
        <SendPopupWrapper>
          <Switch>
            <Match when={txnResult() === null}>
              <SendPopupHeading>Send {props.symbol}</SendPopupHeading>
              <SendPopupBody>
                <AccountCard
                  fullWidth
                  accountId={props.accountId}
                  assetId={props.assetId}
                  name={props.name}
                  principal={props.principal}
                  balance={props.balance}
                  decimals={props.decimals}
                  symbol={props.symbol}
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
                    KindTokens={{
                      onChange: setAmount,
                      decimals: props.decimals,
                      symbol: props.symbol,
                      validate: (val) =>
                        val + props.fee > props.balance
                          ? `Insufficient balance (max ${tokensToStr(props.balance - props.fee, props.decimals)})`
                          : null,
                    }}
                  />
                  <Show when={amount() !== BigInt(0)}>
                    <FeeLine>
                      <FeeLineAmount>
                        <FeeLineAmountQty>+{tokensToStr(props.fee, props.decimals)}</FeeLineAmountQty>
                        <FeeLineAmountSymbol>{props.symbol}</FeeLineAmountSymbol>
                      </FeeLineAmount>
                      <FeeLineReason>System Fee</FeeLineReason>
                    </FeeLine>
                  </Show>
                </FeeLinesWrapper>
                <ButtonsWrapper>
                  <Button
                    disabled={sending()}
                    onClick={() => props.onCancel?.(false)}
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
            <Match when={txnResult()?.success}>
              <SendPopupHeading>Success</SendPopupHeading>
              <SendPopupBody>
                <StatusText>
                  Transacton #{txnResult()!.blockIdx!.toString()} has beed <Accent>successfully</Accent> executed
                </StatusText>
                <SubStatusText>
                  {txnResult()!.totalAmount!} {props.symbol} were deducted from your balance
                </SubStatusText>
                <ButtonsWrapper>
                  <Button fullWidth onClick={() => props.onCancel?.(true)} kind={EButtonKind.Primary} text="Go Back" />
                </ButtonsWrapper>
              </SendPopupBody>
            </Match>

            <Match when={!txnResult()?.success}>
              <SendPopupHeading>Fail</SendPopupHeading>
              <SendPopupBody>
                <StatusText>
                  Transacton has <span class={ErrorText}>failed</span> to execute with the following error:{" "}
                </StatusText>
                <SubStatusText>{txnResult()!.error!}</SubStatusText>
                <ButtonsWrapper>
                  <Button
                    fullWidth
                    onClick={() => props.onCancel?.(false)}
                    kind={EButtonKind.Additional}
                    text="Go Back"
                  />
                </ButtonsWrapper>
              </SendPopupBody>
            </Match>
          </Switch>
        </SendPopupWrapper>
      </SendPopupBg>
    </Portal>
  );
}

const SendPopupBg = styled.div<{ center: boolean }>`
  position: fixed;
  overflow: auto;
  z-index: 2;

  box-sizing: border-box;

  top: ${(HEADER_HEIGHT + BAR_HEIGHT).toString()}px;
  left: 0;
  right: 0;
  bottom: 0;

  padding: 80px 40px;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  ${(props) => (props.center ? "justify-content: center;" : "")}

  background-color: ${COLOR_BLACK};
`;

const SendPopupWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
`;

const SendPopupHeading = styled.h3`
  color: ${COLOR_WHITE};
  font-family: DM Sans;
  font-size: 60px;
  font-style: normal;
  font-weight: 600;
  line-height: 90%; /* 54px */
  margin-bottom: 30px;
`;

const SendPopupBody = styled.div`
  display: flex;
  width: 100%;
  max-width: 600px;
  flex-direction: column;
  align-items: flex-start;
  gap: 30px;
`;

const StatusText = styled.p`
  color: ${COLOR_WHITE};
  font-family: DM Sans;
  font-size: 20px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 20px */
`;

const SubStatusText = styled.p`
  color: ${COLOR_GRAY_190};
  font-family: DM Sans;
  font-size: 20px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%; /* 20px */
`;

const ButtonsWrapper = styled.div`
  display: flex;
  height: 50px;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

const FeeLinesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
`;

const FeeLine = styled.div`
  margin-top: 10px;

  display: flex;
  padding: 10px 0px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
`;

const FeeLineAmount = styled.div`
  display: flex;
  align-items: baseline;
  gap: 5px;
`;

const FeeLineAmountQty = styled.p`
  color: ${COLOR_GRAY_140};
  font-family: DM Sans;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 14px */
`;

const FeeLineAmountSymbol = styled.p`
  color: ${COLOR_GRAY_140};
  font-family: DM Sans;
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 10px */
`;

const FeeLineReason = styled.p`
  color: ${COLOR_GRAY_140};
  font-family: DM Sans;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%; /* 14px */
`;
