import { For, Show, createEffect, createSignal } from "solid-js";
import { useMsqClient } from "../../../store/global";
import { useLocation, useNavigate } from "@solidjs/router";
import { Principal } from "@dfinity/principal";
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
import {
  ErrorCode,
  IICRC1TransferRequest,
  TAccountId,
  err,
  originToHostname,
  tokensToStr,
} from "@fort-major/msq-shared";
import { AccountCard } from "../../../components/account-card";
import { AddAccountBtn } from "../../../components/add-account-btn";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { IReceivePopupProps, ReceivePopup } from "../../cabinet/my-assets/receive";
import { IPaymentCheckoutPageProps } from "./checkout";
import { useAssetData } from "../../../store/assets";
import { ROOT, useCurrentRouteProps } from "../../../routes";
import { ICRC35AsyncRequest } from "@fort-major/msq-client";
import { useThirdPartyWallet } from "../../../store/wallets";
import { useICRC35Store } from "../../../store/icrc-35";

export function PaymentPage() {
  const [selectedAccountId, setSelectedAccountId] = createSignal<TAccountId>(0);
  const [receivePopupProps, setReceivePopupProps] = createSignal<IReceivePopupProps | null>(null);
  const [loading, setLoading] = createSignal(false);

  const { assets, assetMetadata, fetchMetadata, fetchAccountInfo, refreshBalances, addAsset, addAccount } =
    useAssetData();
  const msq = useMsqClient();
  const { getIcrc35Request } = useICRC35Store();
  const navigate = useNavigate();
  const { connectWallet, connectedWallets } = useThirdPartyWallet();

  const getAssetId = () => getIcrc35Request<IICRC1TransferRequest>()!.payload.canisterId;

  createEffect(async () => {
    if (!getIcrc35Request()) {
      navigate(ROOT.path);
      return;
    }

    const req = getIcrc35Request<IICRC1TransferRequest>()!;

    // validate other inputs
    Principal.fromText(req.payload.to.owner);
    if (req.payload.amount < 0n) {
      err(ErrorCode.INVALID_INPUT, `Amount is less than zero: ${req.payload.amount}`);
    }

    const assetId = getAssetId()!;

    await fetchMetadata([assetId]);

    if (!msq()) {
      return;
    }

    const result = await fetchAccountInfo([assetId]);

    // canister ID will be validated here
    if (!result || !result[0]) {
      await addAsset!(assetId);
    }

    await refreshBalances!([assetId]);
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
      symbol: assetMetadata[assetId]!.metadata!.symbol,
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
    const asset = assets[assetId]!;
    const { metadata } = assetMetadata[assetId]!;
    const req = getIcrc35Request<IICRC1TransferRequest>()!;

    const p: IPaymentCheckoutPageProps = {
      accountId,
      accountName: asset.accounts[accountId].name,
      accountBalance: asset.accounts[accountId].balance!,
      accountPrincipal: asset.accounts[accountId].principal,

      assetId: req.payload.canisterId,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
      fee: metadata.fee,

      peerOrigin: req.peerOrigin,

      amount: req.payload.amount,
      recepientPrincipal: req.payload.to.owner,
      recepientSubaccount: req.payload.to.subaccount,
      memo: req.payload.memo,
      createdAt: req.payload.createdAt,

      onSuccess: handleCheckoutSuccess,
      onFail: handleCheckoutFail,
      onCancel: handleCheckoutCancel,
      onBack: handleCheckoutBack,
    };

    navigate(ROOT["/"].integration["/"].pay["/"].checkout.path, { state: p });
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

  const handleConnectPlug = async () => {
    await connectWallet("plug");

    console.log("Plug connected", await connectedWallets()["plug"]?.getPrincipal());
  };

  const handleConnectBitfinity = async () => {
    await connectWallet("bitfinity");

    console.log("Bitfinity connected", await connectedWallets()["bitfinity"]?.getPrincipal());
  };

  const handleConnectNNS = async () => {
    await connectWallet("nns");

    console.log("NNS connected", await connectedWallets()["nns"]?.getPrincipal());
  };

  return (
    <Show when={getIcrc35Request()}>
      <PaymentPageContainer>
        <PaymentPageWrapper>
          <PaymentPageHeading>
            <Text size={20} weight={600}>
              Pending payment on <span class={ColorAccent}>{originToHostname(getIcrc35Request()!.peerOrigin)}</span>
            </Text>
            <Show when={getAssetId() && assetMetadata[getAssetId()!]?.metadata}>
              <H3>
                {tokensToStr(
                  getIcrc35Request<IICRC1TransferRequest>()!.payload.amount,
                  assetMetadata[getAssetId()!]!.metadata!.decimals,
                  undefined,
                  true,
                )}{" "}
                {assetMetadata[getAssetId()!]!.metadata!.symbol}
              </H3>
              <button onClick={handleConnectPlug}>Connect Plug</button>
              <button onClick={handleConnectBitfinity}>Connect Bitfinity</button>
              <button onClick={handleConnectNNS}>Connect NNS</button>
            </Show>
          </PaymentPageHeading>
          <Show when={assets[getAssetId()!]?.accounts && assetMetadata[getAssetId()!]?.metadata}>
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
                        assetId={getIcrc35Request<IICRC1TransferRequest>()!.payload.canisterId}
                        name={account.name}
                        balance={account.balance}
                        principal={account.principal}
                        decimals={assetMetadata[getAssetId()!]!.metadata!.decimals}
                        symbol={assetMetadata[getAssetId()!]!.metadata!.symbol}
                        targetBalance={
                          getIcrc35Request<IICRC1TransferRequest>()!.payload.amount +
                          assetMetadata[getAssetId()!]!.metadata!.fee
                        }
                      />
                    )}
                  </For>
                </PaymentPageAccounts>
                <AddAccountBtn
                  disabled={loading()}
                  loading={loading()}
                  symbol={assetMetadata[getAssetId()!]!.metadata!.symbol}
                  onClick={() =>
                    handleAddAccount(
                      getIcrc35Request<IICRC1TransferRequest>()!.payload.canisterId,
                      assetMetadata[getAssetId()!]!.metadata!.name,
                      assetMetadata[getAssetId()!]!.metadata!.symbol,
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
                    getIcrc35Request<IICRC1TransferRequest>()!.payload.amount +
                      assetMetadata[getAssetId()!]!.metadata!.fee
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
      </PaymentPageContainer>
    </Show>
  );
}
