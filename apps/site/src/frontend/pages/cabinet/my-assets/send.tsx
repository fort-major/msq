import { styled } from "solid-styled-components";
import { AccountCard, IAccountCardProps } from "../../../components/account-card";
import { BAR_HEIGHT, COLOR_BLACK, COLOR_GRAY_140, COLOR_WHITE, HEADER_HEIGHT } from "../../../ui-kit";
import { Input } from "../../../ui-kit/input";
import { DEFAULT_PRINCIPAL, DEFAULT_SUBACCOUNT, tokensToStr } from "../../../utils";
import { Show, createSignal } from "solid-js";
import { Principal } from "@dfinity/principal";
import { Portal } from "solid-js/web";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";

export interface ISendPopupProps {
  accountId: number;
  assetId: string;
  name: string;
  principal: string;
  balance: bigint;
  decimals: number;
  symbol: string;
  fee: bigint;

  onCancel?: () => void;
}

const VALID_HEX_SYMBOLS = ["0123456789abcdefABCDEF"];
const validateHex = (hex: string) =>
  hex.split("").every((c) => c in VALID_HEX_SYMBOLS) && hex.length % 2 == 0 ? null : "Invalid hex string";

export function SendPopup(props: ISendPopupProps) {
  const [recipientPrincipal, setRecipientPrincipal] = createSignal<Principal | null>(null);
  const [recipientSubaccount, setRecipientSubaccount] = createSignal<string | null>(null);
  const [memo, setMemo] = createSignal<string | null>(null);
  const [amount, setAmount] = createSignal<bigint>(0n);

  const isCorrect = () => true;

  const handleSend = () => {};

  return (
    <Portal mount={document.getElementById("portal")!}>
      <SendPopupBg>
        <SendPopupWrapper>
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
              kind={{ Principal: { onChange: setRecipientPrincipal } }}
            />
            <Input
              label="Subaccount"
              placeholder={DEFAULT_SUBACCOUNT}
              kind={{ String: { onChange: setRecipientSubaccount, validate: validateHex } }}
            />
            <Input
              label="Memo"
              placeholder="Enter your memo"
              kind={{ String: { onChange: setMemo, validate: validateHex } }}
            />
            <FeeLinesWrapper>
              <Input
                label="Enter Amount"
                placeholder="1,234.5678"
                required
                kind={{ Tokens: { onChange: setAmount, decimals: props.decimals, symbol: props.symbol } }}
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
              <Button onClick={props.onCancel} fullWidth kind={EButtonKind.Additional} text="Cancel" />
              <Show when={isCorrect()}>
                <Button
                  onClick={handleSend}
                  fullWidth
                  kind={EButtonKind.Primary}
                  text="Continue"
                  icon={EIconKind.ArrowRightUp}
                />
              </Show>
            </ButtonsWrapper>
          </SendPopupBody>
        </SendPopupWrapper>
      </SendPopupBg>
    </Portal>
  );
}

const SendPopupBg = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
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

  background-color: ${COLOR_BLACK};
`;

const SendPopupWrapper = styled.div``;

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
