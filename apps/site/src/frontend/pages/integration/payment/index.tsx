import { For, Show, createEffect, createSignal } from "solid-js";
import { useMasqueradeClient } from "../../../store/global";
import {
  referrerOrigin,
  sendICRC1TransferResult,
  useIcrc1TransferRequestMsg,
  useReferrerWindow,
} from "../../../store/integration";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Principal } from "@dfinity/principal";
import { tokensToStr } from "../../../utils";
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
import { ColorAccent, H3, Text } from "../../../ui-kit/typography";
import { ErrorCode, TAccountId, err, originToHostname } from "@fort-major/masquerade-shared";
import { AccountCard } from "../../../components/account-card";
import { AddAccountBtn } from "../../../components/add-account-btn";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { IReceivePopupProps, ReceivePopup } from "../../cabinet/my-assets/receive";
import { IPaymentCheckoutPageProps } from "./checkout";
import { useAssetData, usePaymentCheckoutPageProps } from "../../../store/assets";
import { ContactUsBtn } from "../../../components/contact-us-btn";

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

      // canister ID will be validated here
      if (!result || !result[0]) {
        await addAsset!(assetId);
      }

      // validate other inputs
      Principal.fromText(icrc1TransferRequest()!.request.to.owner);
      if (icrc1TransferRequest()!.request.amount < 0n) {
        err(ErrorCode.INVALID_INPUT, `Amount is less than zero: ${icrc1TransferRequest()!.request.amount}`);
      }

      await refresh!([assetId]);
    }
  });

  const handleAddAccount = async (assetId: string, assetName: string, symbol: string) => {
    setLoading(true);
    document.body.style.cursor = "wait";

    await addAccount!(assetId, assetName, symbol);

    document.body.style.cursor = "unset";
    setLoading(false);
  };

  const handleReceive = (accountId: TAccountId) => {
    const assetId = getAssetId()!;

    setReceivePopupProps({
      assetId,
      principal: assets[assetId]!.accounts[accountId].principal!,
      symbol: assets[assetId]!.metadata!.symbol,
      onClose: handleReceiveClose,
    });
  };

  const handleReceiveClose = () => {
    setReceivePopupProps(null);
  };

  const handleCheckoutBack = () => {
    window.close();
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
      onBack: handleCheckoutBack,
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
    navigate("/integration/pay", { replace: true });
    setCheckoutPageProps(undefined);
  };

  return (
    <PaymentPageContainer>
      <PaymentPageWrapper>
        <PaymentPageHeading>
          <Text size={20} weight={600}>
            Pending payment on <span class={ColorAccent}>{originToHostname(referrerOrigin!)}</span>
          </Text>
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
            <Text size={20} weight={600}>
              Select an account to continue:
            </Text>
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
              <Button kind={EButtonKind.Additional} onClick={handleCheckoutBack} text="Dismiss" fullWidth />
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
      <ContactUsBtn />
    </PaymentPageContainer>
  );
}
