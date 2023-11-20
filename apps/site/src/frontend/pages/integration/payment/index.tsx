import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import { useLoader, useMasqueradeClient } from "../../../store/global";
import {
  referrerOrigin,
  sendICRC1TransferResult,
  useIcrc1TransferRequestMsg,
  usePaymentCheckoutPageProps,
  useReferrerWindow,
} from "../../../store/integration";
import { useNavigate } from "@solidjs/router";
import { createStore, produce } from "solid-js/store";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";
import { DEFAULT_PRINCIPAL, getAssetMetadata, makeAnonymousAgent, makeIcrc1Salt, tokensToStr } from "../../../utils";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";
import {
  AccountCardBase,
  AccountCardSelected,
  PaymentPageAccounts,
  PaymentPageAccountsWrapper,
  PaymentPageButtons,
  PaymentPageContainer,
  PaymentPageContent,
  PaymentPageHeading,
  PaymentPageWrapper,
} from "./style";
import { H3, Span600, SpanAccent, Text20 } from "../../../ui-kit/typography";
import { TAccountId, originToHostname } from "@fort-major/masquerade-shared";
import { AccountCard } from "../../../components/account-card";
import { AddAccountBtn } from "../../../components/add-account-btn";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { IReceivePopupProps, ReceivePopup } from "../../cabinet/my-assets/receive";
import { IPaymentCheckoutPageProps } from "./checkout";
import { useAssetData } from "../../../store/assets";

export function PaymentPage() {
  const msq = useMasqueradeClient();
  const icrc1TransferRequest = useIcrc1TransferRequestMsg();
  const { assets, fetch, refresh, addAsset, addAccount } = useAssetData();
  const [selectedAccountId, setSelectedAccountId] = createSignal<TAccountId>(0);
  const [receivePopupProps, setReceivePopupProps] = createSignal<IReceivePopupProps | null>(null);
  const [checkoutPageProps, setCheckoutPageProps] = usePaymentCheckoutPageProps();
  const [referrerWindow] = useReferrerWindow();
  const navigate = useNavigate();

  const [loading, setLoading] = createSignal(false);

  const getAssetId = () => icrc1TransferRequest()?.request.canisterId;

  if (referrerOrigin === null || referrerOrigin === window.location.origin) navigate("/");

  createEffect(async () => {
    if (icrc1TransferRequest() && msq()) {
      const assetId = getAssetId()!;
      const result = await fetch([assetId]);

      if (!result) {
        await addAsset!(assetId);
        return;
      }

      await refresh!([assetId]);
    }
  });

  const handleAddAccount = async (assetId: string, assetName: string, symbol: string) => {
    setLoading(true);

    await addAccount!(assetId, assetName, symbol);

    setLoading(false);
  };

  const handleReceive = (accountId: TAccountId) => {
    const assetId = getAssetId()!;

    setReceivePopupProps({
      principal: assets[assetId]!.accounts[accountId].principal!,
      symbol: assets[assetId]!.metadata!.symbol,
      onClose: handleReceiveClose,
    });
  };

  const handleReceiveClose = () => {
    setReceivePopupProps(null);
  };

  const handleCheckoutStart = (accountId: TAccountId) => {
    const assetId = getAssetId()!;

    const p: IPaymentCheckoutPageProps = {
      accountId,
      accountName: assets[assetId]!.accounts[accountId].name,
      accountBalance: assets[assetId]!.accounts[accountId].balance!,
      accountPrincipal: assets[assetId]!.accounts[accountId].principal,

      assetId: icrc1TransferRequest()!.request.canisterId,
      symbol: assets[assetId]!.metadata!.symbol,
      decimals: assets[assetId]!.metadata!.decimals,
      fee: assets[assetId]!.metadata!.fee,

      amount: icrc1TransferRequest()!.request.amount,
      recepientPrincipal: icrc1TransferRequest()!.request.to.owner,
      recepientSubaccount: icrc1TransferRequest()!.request.to.subaccount,
      memo: icrc1TransferRequest()!.request.memo,
      createdAt: icrc1TransferRequest()!.request.createdAt,

      onSuccess: handleCheckoutSuccess,
      onFail: handleCheckoutFail,
      onCancel: handleCheckoutCancel,
    };

    setCheckoutPageProps(p);
    navigate("/integration/pay/checkout");
  };

  const handleCheckoutSuccess = (blockId: bigint) => {
    sendICRC1TransferResult(referrerWindow()!, blockId, null);
  };

  const handleCheckoutFail = () => {
    sendICRC1TransferResult(referrerWindow()!, undefined, null);
  };

  const handleCheckoutCancel = () => {
    setCheckoutPageProps(undefined);
    navigate("/integration/pay");
  };

  return (
    <PaymentPageContainer>
      <PaymentPageWrapper>
        <PaymentPageHeading>
          <Text20>
            <Span600>
              Pending payment on <SpanAccent>{originToHostname(referrerOrigin!)}</SpanAccent>
            </Span600>
          </Text20>
          <Show when={getAssetId() && assets[getAssetId()!]?.metadata}>
            <H3>
              {tokensToStr(
                icrc1TransferRequest()!.request.amount,
                assets[getAssetId()!]!.metadata!.decimals,
                undefined,
                true,
              )}{" "}
              {assets[getAssetId()!]!.metadata!.symbol}
            </H3>
          </Show>
        </PaymentPageHeading>
        <Show when={assets[getAssetId()!]?.accounts && assets[getAssetId()!]?.metadata}>
          <PaymentPageContent>
            <Text20>
              <Span600>Select an account to continue:</Span600>
            </Text20>
            <PaymentPageAccountsWrapper>
              <PaymentPageAccounts>
                <For each={assets[getAssetId()!]?.accounts}>
                  {(account, idx) => (
                    <AccountCard
                      classList={{ [AccountCardBase]: true, [AccountCardSelected]: idx() === selectedAccountId() }}
                      onClick={(accountId) => setSelectedAccountId(accountId)}
                      accountId={idx()}
                      assetId={icrc1TransferRequest()!.request.canisterId}
                      name={account.name}
                      balance={account.balance}
                      principal={account.principal}
                      decimals={assets[getAssetId()!]!.metadata!.decimals}
                      symbol={assets[getAssetId()!]!.metadata!.symbol}
                      targetBalance={icrc1TransferRequest()!.request.amount + assets[getAssetId()!]!.metadata!.fee}
                    />
                  )}
                </For>
              </PaymentPageAccounts>
              <AddAccountBtn
                disabled={loading()}
                loading={loading()}
                symbol={assets[getAssetId()!]!.metadata!.symbol}
                onClick={() =>
                  handleAddAccount(
                    icrc1TransferRequest()!.request.canisterId,
                    assets[getAssetId()!]!.metadata!.name,
                    assets[getAssetId()!]!.metadata!.symbol,
                  )
                }
              />
            </PaymentPageAccountsWrapper>
            <PaymentPageButtons>
              <Button kind={EButtonKind.Additional} onClick={() => window.close()} text="Dismiss" fullWidth />
              <Show
                when={
                  (assets[getAssetId()!]!.accounts[selectedAccountId()].balance || 0n) >=
                  icrc1TransferRequest()!.request.amount + assets[getAssetId()!]!.metadata!.fee
                }
                fallback={
                  <Button
                    kind={EButtonKind.Secondary}
                    text="Top up the Balance"
                    icon={EIconKind.ArrowLeftDown}
                    onClick={() => handleReceive(selectedAccountId())}
                    disabled={assets[getAssetId()!]!.accounts[selectedAccountId()].principal === undefined}
                    fullWidth
                  />
                }
              >
                <Button
                  kind={EButtonKind.Primary}
                  text="Go to Checkout"
                  icon={EIconKind.ArrowRightUp}
                  fullWidth
                  onClick={() => handleCheckoutStart(selectedAccountId())}
                />
              </Show>
            </PaymentPageButtons>
          </PaymentPageContent>
        </Show>
      </PaymentPageWrapper>
      <Show when={receivePopupProps()}>
        <ReceivePopup {...receivePopupProps()!} />
      </Show>
    </PaymentPageContainer>
  );
}
