import { For, Show, createEffect, createSignal } from "solid-js";
import { useICRC35, useMsqClient } from "../../../store/global";
import { useNavigate } from "@solidjs/router";
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
import { ErrorCode, IICRC1TransferRequest, TAccountId, err, originToHostname } from "@fort-major/msq-shared";
import { AccountCard } from "../../../components/account-card";
import { AddAccountBtn } from "../../../components/add-account-btn";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { IReceivePopupProps, ReceivePopup } from "../../cabinet/my-assets/receive";
import { IPaymentCheckoutPageProps } from "./checkout";
import { useAssetData, usePaymentCheckoutPageProps } from "../../../store/assets";
import { ContactUsBtn } from "../../../components/contact-us-btn";

export function PaymentPage() {
  const msq = useMsqClient();
  const { assets, fetch, refresh, addAsset, addAccount } = useAssetData();
  const [selectedAccountId, setSelectedAccountId] = createSignal<TAccountId>(0);
  const [receivePopupProps, setReceivePopupProps] = createSignal<IReceivePopupProps | null>(null);
  const [_, setCheckoutPageProps] = usePaymentCheckoutPageProps();
  const [icrc35Request] = useICRC35<IICRC1TransferRequest>();
  const navigate = useNavigate();

  const [loading, setLoading] = createSignal(false);

  const getAssetId = () => icrc35Request()!.payload.canisterId;

  createEffect(async () => {
    if (!icrc35Request()) {
      navigate("/");
      return;
    }

    if (!msq()) {
      return;
    }

    const assetId = getAssetId()!;

    const result = await fetch([assetId]);

    // canister ID will be validated here
    if (!result || !result[0]) {
      await addAsset!(assetId);
    }

    // validate other inputs
    Principal.fromText(icrc35Request()!.payload.to.owner);
    if (icrc35Request()!.payload.amount < 0n) {
      err(ErrorCode.INVALID_INPUT, `Amount is less than zero: ${icrc35Request()!.payload.amount}`);
    }

    await refresh!([assetId]);
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

      assetId: icrc35Request()!.payload.canisterId,
      symbol: assets[assetId]!.metadata!.symbol,
      decimals: assets[assetId]!.metadata!.decimals,
      fee: assets[assetId]!.metadata!.fee,

      peerOrigin: icrc35Request()!.peerOrigin,

      amount: icrc35Request()!.payload.amount,
      recepientPrincipal: icrc35Request()!.payload.to.owner,
      recepientSubaccount: icrc35Request()!.payload.to.subaccount,
      memo: icrc35Request()!.payload.memo,
      createdAt: icrc35Request()!.payload.createdAt,

      onSuccess: handleCheckoutSuccess,
      onFail: handleCheckoutFail,
      onCancel: handleCheckoutCancel,
      onBack: handleCheckoutBack,
    };

    setCheckoutPageProps(p);
    navigate("/integration/pay/checkout");
  };

  const handleCheckoutSuccess = (blockId: bigint) => {
    icrc35Request()!.respond(blockId);
    icrc35Request()!.closeConnection();
  };

  const handleCheckoutFail = () => {
    icrc35Request()!.respond(undefined);
    icrc35Request()!.closeConnection();
  };

  const handleCheckoutCancel = () => {
    navigate("/integration/pay", { replace: true });
    setCheckoutPageProps(undefined);
  };

  return (
    <Show when={icrc35Request()}>
      <PaymentPageContainer>
        <PaymentPageWrapper>
          <PaymentPageHeading>
            <Text size={20} weight={600}>
              Pending payment on <span class={ColorAccent}>{originToHostname(icrc35Request()!.peerOrigin)}</span>
            </Text>
            <Show when={getAssetId() && assets[getAssetId()!]?.metadata}>
              <H3>
                {tokensToStr(
                  icrc35Request()!.payload.amount,
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
                        assetId={icrc35Request()!.payload.canisterId}
                        name={account.name}
                        balance={account.balance}
                        principal={account.principal}
                        decimals={assets[getAssetId()!]!.metadata!.decimals}
                        symbol={assets[getAssetId()!]!.metadata!.symbol}
                        targetBalance={icrc35Request()!.payload.amount + assets[getAssetId()!]!.metadata!.fee}
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
                      icrc35Request()!.payload.canisterId,
                      assets[getAssetId()!]!.metadata!.name,
                      assets[getAssetId()!]!.metadata!.symbol,
                    )
                  }
                />
              </PaymentPageAccountsWrapper>
              <PaymentPageButtons>
                <Button
                  label="dismiss"
                  kind={EButtonKind.Additional}
                  onClick={handleCheckoutBack}
                  text="Dismiss"
                  fullWidth
                />
                <Show
                  when={
                    (assets[getAssetId()!]!.accounts[selectedAccountId()].balance || 0n) >=
                    icrc35Request()!.payload.amount + assets[getAssetId()!]!.metadata!.fee
                  }
                  fallback={
                    <Button
                      label="top up the balance"
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
                    label="go to checkout"
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
    </Show>
  );
}
