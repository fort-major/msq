import { Principal, TAccountId, bytesToHex, debugStringify, tokensToStr, unreacheable } from "@fort-major/msq-shared";
import { AccountCard } from "../../../../components/account-card";
import { H3, H5, Text } from "../../../../ui-kit/typography";
import {
  CheckoutFeeLine,
  CheckoutFeeLineSum,
  CheckoutFees,
  CheckoutForm,
  CheckoutFormInput,
  CheckoutFormInputField,
  CheckoutPageContent,
  CheckoutPageWrapper,
  CheckoutTotalInfo,
  CheckoutTotalButtons,
  CheckoutTotalSum,
  CheckoutTotalWrapper,
  Elipsis,
  CopyIcon,
} from "./style";
import { EIconKind, Icon } from "../../../../ui-kit/icon";
import { Match, Show, Switch, createSignal, onMount } from "solid-js";
import { assertIs } from "../../../../utils";
import { Button, EButtonKind } from "../../../../ui-kit/button";
import { useNavigate } from "@solidjs/router";
import { ITxnResult } from "../../../cabinet/my-assets/send";
import { TxnFailPage } from "../../../txn/fail";
import { TxnSuccessPage } from "../../../txn/success";
import { COLOR_ACCENT, COLOR_GRAY_140, COLOR_GRAY_165 } from "../../../../ui-kit";
import { ROOT, useCurrentRouteProps } from "../../../../routes";
import { useThirdPartyWallet } from "../../../../store/wallets";
import { IWallet } from "../../../../utils/wallets";
import { ICRC1IDLFactory, ICRC1Token } from "../../../../utils/icrc-1";
import { Actor } from "@dfinity/agent";
import { useICRC35Store } from "../../../../store/icrc-35";

export interface IPaymentCheckoutPageProps {
  accountId: TAccountId;
  accountName: string;
  accountBalance: bigint;
  accountPrincipal?: string;

  assetId: string;
  symbol: string;
  decimals: number;
  fee: bigint;

  peerOrigin?: string;

  amount: bigint;
  recepientPrincipal: string;
  recepientSubaccount?: Uint8Array;
  memo?: Uint8Array;
  createdAt?: bigint;
}

export function PaymentCheckoutPage() {
  const props = useCurrentRouteProps<IPaymentCheckoutPageProps>();
  const { connectedWallet } = useThirdPartyWallet();
  const navigate = useNavigate();
  const { getIcrc35Request } = useICRC35Store();

  const [loading, setLoading] = createSignal(false);
  const [txnResult, setTxnResult] = createSignal<ITxnResult | null>(null);
  const [principalCopied, setPrincipalCopied] = createSignal(false);
  const [subaccountCopied, setSubaccountCopied] = createSignal(false);
  const [memoCopied, setMemoCopied] = createSignal(false);

  onMount(() => {
    if (!props) navigate(ROOT.path, { replace: true });
    if (!connectedWallet() || !connectedWallet()![1]) unreacheable("The wallet is not connected properly");
  });

  const handleCopyRecipientPrincipal = () => {
    navigator.clipboard.writeText(props!.recepientPrincipal);
    setPrincipalCopied(true);
  };

  const handleCopyRecipientSubaccount = () => {
    navigator.clipboard.writeText(bytesToHex(props!.recepientSubaccount!));
    setSubaccountCopied(true);
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(bytesToHex(props!.memo!));
    setMemoCopied(true);
  };

  const calcSystemFee = () => props!.fee;
  const calcTotalAmount = () => props!.amount + calcSystemFee();

  const handlePay = async () => {
    const [_, wallet] = connectedWallet()!;
    assertIs<IPaymentCheckoutPageProps>(props);

    setLoading(true);
    document.body.style.cursor = "wait";

    const totalAmount = calcTotalAmount();
    const totalAmountStr = tokensToStr(totalAmount, props!.decimals, undefined, true);

    // create a wallet-specific actor object targeting the token
    const ledger = await (wallet as IWallet).createActor<ICRC1Token & Actor>({
      interfaceFactory: ICRC1IDLFactory,
      canisterId: props!.assetId,
    });

    // make the transfer
    const result = await ledger.icrc1_transfer({
      created_at_time: props.createdAt ? [props!.createdAt] : [BigInt(Date.now()) * 1_000_000n],
      to: {
        owner: Principal.fromText(props.recepientPrincipal),
        subaccount: props.recepientSubaccount ? [props.recepientSubaccount!] : [],
      },
      from_subaccount: [],
      amount: props.amount,
      memo: props.memo ? [props.memo] : [],
      fee: props.fee ? [props.fee] : [],
    });

    // if failed, show error page
    if ("Err" in result) {
      let err = debugStringify(result.Err);

      handleCheckoutFail();

      setTxnResult({ success: false, error: err });

      document.body.style.cursor = "unset";
      setLoading(false);

      return;
    }

    // otherwise, report the blockID and show success page
    const blockIdx = result.Ok;

    handleCheckoutSuccess(blockIdx);

    setTxnResult({
      success: true,
      blockIdx,
      totalAmount: totalAmountStr,
    });

    document.body.style.cursor = "unset";
    setLoading(false);
  };

  const handleCheckoutSuccess = (blockId: bigint) => {
    getIcrc35Request()!.respond(blockId);
    getIcrc35Request()!.closeConnection();
  };

  const handleCheckoutFail = () => {
    getIcrc35Request()!.respond(undefined);
    getIcrc35Request()!.closeConnection();
  };

  const handleCheckoutCancel = () => {
    navigate(ROOT["/"].integration["/"].pay.path, { replace: true });
  };

  const handleCheckoutBack = () => {
    window.close();
  };

  return (
    <CheckoutPageWrapper>
      <Switch>
        <Match when={txnResult() === null && props}>
          <CheckoutPageContent>
            <H3>Send {props!.symbol}</H3>
            <AccountCard
              fullWidth
              accountId={props!.accountId}
              assetId={props!.assetId}
              name={props!.accountName}
              principal={props!.accountPrincipal}
              balance={props!.accountBalance}
              decimals={props!.decimals}
              symbol={props!.symbol}
            />
            <CheckoutForm>
              <CheckoutFormInput>
                <Text size={12} weight={500} color={COLOR_GRAY_165}>
                  Principal ID
                </Text>
                <CheckoutFormInputField>
                  <Text size={16} weight={600} class={Elipsis}>
                    {props!.recepientPrincipal}
                  </Text>
                  <Show
                    when={principalCopied()}
                    fallback={
                      <Icon
                        kind={EIconKind.Copy}
                        size={14}
                        onClick={handleCopyRecipientPrincipal}
                        classList={{ [CopyIcon]: true }}
                      />
                    }
                  >
                    <Icon
                      kind={EIconKind.Check}
                      size={14}
                      onClick={handleCopyRecipientPrincipal}
                      color={COLOR_ACCENT}
                    />
                  </Show>
                </CheckoutFormInputField>
              </CheckoutFormInput>
              <CheckoutFormInput>
                <Text size={12} weight={500} color={COLOR_GRAY_165}>
                  Subaccount ID
                </Text>
                <CheckoutFormInputField>
                  <Text size={16} weight={600} class={Elipsis}>
                    {props!.recepientSubaccount ? bytesToHex(props!.recepientSubaccount!) : "Default Subaccount"}
                  </Text>
                  <Show when={props!.recepientSubaccount}>
                    <Show
                      when={subaccountCopied()}
                      fallback={
                        <Icon
                          kind={EIconKind.Copy}
                          size={14}
                          onClick={handleCopyRecipientSubaccount}
                          classList={{ [CopyIcon]: true }}
                        />
                      }
                    >
                      <Icon
                        kind={EIconKind.Check}
                        size={14}
                        onClick={handleCopyRecipientSubaccount}
                        color={COLOR_ACCENT}
                      />
                    </Show>
                  </Show>
                </CheckoutFormInputField>
              </CheckoutFormInput>
              <CheckoutFormInput>
                <Text size={12} weight={500} color={COLOR_GRAY_165}>
                  Memo
                </Text>
                <CheckoutFormInputField>
                  <Text size={16} weight={600} class={Elipsis}>
                    {props!.memo ? bytesToHex(props!.memo!) : "-"}
                  </Text>
                  <Show when={props!.memo}>
                    <Show
                      when={memoCopied()}
                      fallback={
                        <Icon
                          kind={EIconKind.Copy}
                          size={14}
                          onClick={handleCopyMemo}
                          classList={{ [CopyIcon]: true }}
                        />
                      }
                    >
                      <Icon kind={EIconKind.Check} size={14} onClick={handleCopyMemo} color={COLOR_ACCENT} />
                    </Show>
                  </Show>
                </CheckoutFormInputField>
              </CheckoutFormInput>
            </CheckoutForm>
            <CheckoutFees>
              <CheckoutFeeLine>
                <Text size={16} color={COLOR_GRAY_140}>
                  Amount
                </Text>
                <CheckoutFeeLineSum>
                  <Text size={16} weight={600} color={COLOR_GRAY_140}>
                    {tokensToStr(props!.amount, props!.decimals, undefined, true)}
                  </Text>
                  <Text size={12} weight={500} color={COLOR_GRAY_140}>
                    {props!.symbol}
                  </Text>
                </CheckoutFeeLineSum>
              </CheckoutFeeLine>
              <CheckoutFeeLine>
                <Text size={16} color={COLOR_GRAY_140}>
                  System Fee
                </Text>
                <CheckoutFeeLineSum>
                  <Text size={16} weight={600} color={COLOR_GRAY_140}>
                    {tokensToStr(calcSystemFee(), props!.decimals, undefined, true)}
                  </Text>
                  <Text size={12} color={COLOR_GRAY_140} weight={500}>
                    {props!.symbol}
                  </Text>
                </CheckoutFeeLineSum>
              </CheckoutFeeLine>
            </CheckoutFees>
            <CheckoutTotalWrapper>
              <CheckoutTotalInfo>
                <Text size={12} weight={500} color={COLOR_GRAY_140}>
                  Total Amount:
                </Text>
                <CheckoutTotalSum>
                  <H5>{tokensToStr(calcTotalAmount(), props!.decimals, undefined, true)}</H5>
                  <Text size={12} weight={600}>
                    {props!.symbol}
                  </Text>
                </CheckoutTotalSum>
              </CheckoutTotalInfo>
              <CheckoutTotalButtons>
                <Button
                  label="cancel"
                  kind={EButtonKind.Additional}
                  text="Cancel"
                  onClick={handleCheckoutCancel}
                  fullWidth
                  disabled={loading()}
                />
                <Button
                  label="continue"
                  kind={EButtonKind.Primary}
                  text="Continue"
                  icon={loading() ? EIconKind.Loader : EIconKind.ArrowRightUp}
                  onClick={handlePay}
                  fullWidth
                  disabled={loading()}
                />
              </CheckoutTotalButtons>
            </CheckoutTotalWrapper>
          </CheckoutPageContent>
        </Match>
        <Match when={txnResult()!.success}>
          <TxnSuccessPage
            assetId={props!.assetId}
            accountId={props!.accountId}
            accountName={props!.accountName}
            accountPrincipal={props!.accountPrincipal!}
            accountBalance={props!.accountBalance}
            symbol={props!.symbol}
            decimals={props!.decimals}
            amount={calcTotalAmount()}
            blockId={txnResult()!.blockIdx!}
            onBack={handleCheckoutBack}
          />
        </Match>
        <Match when={!txnResult()!.success}>
          <TxnFailPage error={txnResult()?.error!} onBack={handleCheckoutBack} />
        </Match>
      </Switch>
    </CheckoutPageWrapper>
  );
}
