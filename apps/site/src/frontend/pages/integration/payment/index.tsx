import { For, Show, createEffect, createMemo, createSignal, on, onCleanup, onMount } from "solid-js";
import { useMsqClient } from "../../../store/global";
import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";
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
  delay,
  err,
  hexToBytes,
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
import { ROOT } from "../../../routes";
import { TThirdPartyWalletKind, useThirdPartyWallet } from "../../../store/wallets";
import { useICRC35Store } from "../../../store/icrc-35";

interface ITransferRequestSearchParams {
  kind?: "t" | "d";
  "canister-id": string;
  "to-principal": string;
  "to-subaccount"?: string;
  memo?: string;
  amount: string;
}

interface UrlBasedICRC1TransferRequest {
  kind: "transfer" | "donation";
  canisterId: string;
  to: {
    owner: string;
    subaccount?: string;
  };
  memo?: string;
  amount: bigint;
}

export function PaymentPage() {
  const [selectedAccountId, setSelectedAccountId] = createSignal<TAccountId>(0);
  const [receivePopupProps, setReceivePopupProps] = createSignal<IReceivePopupProps | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [refreshing, setRefreshing] = createSignal<boolean | undefined>(false);

  const { assets, assetMetadata, fetchMetadata, fetchAccountInfo, refreshBalances, addAsset, addAccount } =
    useAssetData();
  const { getIcrc35Request } = useICRC35Store();
  const navigate = useNavigate();
  const { connectWallet, initWallet, connectedWallet, setWalletAccount } = useThirdPartyWallet();

  const transferRequest = createMemo(() => {
    const [searchParams] = useSearchParams() as unknown as [ITransferRequestSearchParams];
    if (!searchParams["canister-id"] || !searchParams["to-principal"] || !searchParams["amount"]) return undefined;

    // inputs are validated here or later for principals
    const req: UrlBasedICRC1TransferRequest = {
      kind: searchParams.kind === "d" ? "donation" : "transfer",
      canisterId: searchParams["canister-id"],
      to: {
        owner: searchParams["to-principal"],
        subaccount: searchParams["to-subaccount"],
      },
      memo: searchParams.memo,
      amount: BigInt(searchParams.amount),
    };

    return req;
  });

  const mode = (): "icrc-35" | "url" | undefined =>
    getIcrc35Request() ? "icrc-35" : transferRequest() ? "url" : undefined;

  const getAssetId = () => {
    try {
      switch (mode()) {
        case "icrc-35":
          Principal.fromText(getIcrc35Request<IICRC1TransferRequest>()!.payload.canisterId);
        case "url":
          return Principal.fromText(transferRequest()!.canisterId);
      }
    } catch {
      return undefined;
    }
  };

  const getKind = (): "payment" | "transfer" | "donation" | undefined => {
    switch (mode()) {
      case "icrc-35":
        return "payment";
      case "url":
        return transferRequest()!.kind;
    }
  };

  const getToPrincipal = () => {
    try {
      switch (mode()) {
        case "icrc-35":
          return Principal.fromText(getIcrc35Request<IICRC1TransferRequest>()!.payload.to.owner);
        case "url":
          return Principal.fromText(transferRequest()!.to.owner);
      }
    } catch {
      return undefined;
    }
  };

  const getToSubaccount = () => {
    switch (mode()) {
      case "icrc-35":
        return getIcrc35Request<IICRC1TransferRequest>()!.payload.to.subaccount;
      case "url":
        return transferRequest()!.to.subaccount ? hexToBytes(transferRequest()!.to.subaccount!) : undefined;
    }
  };

  const getMemo = () => {
    switch (mode()) {
      case "icrc-35":
        return getIcrc35Request<IICRC1TransferRequest>()!.payload.memo;
      case "url":
        return transferRequest()!.memo ? hexToBytes(transferRequest()!.memo!) : undefined;
    }
  };

  const getAmount = () => {
    let amount: bigint;

    switch (mode()) {
      case "icrc-35":
        amount = getIcrc35Request<IICRC1TransferRequest>()!.payload.amount;
        break;
      case "url":
        amount = transferRequest()!.amount;
        break;

      default:
        amount = 0n;
    }

    if (amount > 0n) return amount;
    return undefined;
  };

  const isValidRequest = () =>
    getAssetId() !== undefined && getToPrincipal() !== undefined && getAmount() !== undefined;

  const getInitiatorOrigin = () => {
    switch (mode()) {
      case "icrc-35":
        return getIcrc35Request<IICRC1TransferRequest>()!.peerOrigin;
      case "url":
        return window.document.referrer ? new URL(window.document.referrer).origin : undefined;
    }
  };

  createEffect(
    on(isValidRequest, async (isValid) => {
      if (!isValid) {
        navigate(ROOT["/"].error["/"]["bad-payment-request"].path);
        return;
      }

      await fetchMetadata([getAssetId()!.toText()]);
    }),
  );

  createEffect(
    on(getAssetId, async (assetId) => {
      if (!assetId) return;

      if (connectedWalletIsThirdParty()) {
        return;
      }

      const result = await fetchAccountInfo([assetId.toText()]);

      // canister ID will be validated here
      if (!result || !result[0]) {
        err(ErrorCode.ICRC1_ERROR, "Token not found");
      }

      await refreshBalances!([assetId.toText()]);
    }),
  );

  createEffect(async () => {
    if (connectedWallet() && refreshing() === false) {
      setRefreshing(true);

      while (refreshing() !== undefined) {
        await delay(2000);
        await refreshBalances!([getAssetId()!.toText()]);
      }
    }
  });

  onCleanup(() => {
    setRefreshing(undefined);
  });

  const handleAddAccount = async (assetId: string, assetName: string, symbol: string) => {
    setLoading(true);
    document.body.style.cursor = "wait";

    await addAccount!(assetId, assetName, symbol);

    document.body.style.cursor = "unset";
    setLoading(false);
  };

  const handleReceive = (accountId: TAccountId) => {
    const assetId = getAssetId()!.toText();

    setReceivePopupProps({
      assetId: assetId,
      principal: assets[assetId]!.accounts[accountId].principal!,
      symbol: assetMetadata[assetId]!.metadata!.symbol,
      onClose: handleReceiveClose,
    });
  };

  const handleReceiveClose = () => {
    setReceivePopupProps(null);
  };

  const handleCheckoutStart = (accountId: TAccountId) => {
    const assetId = getAssetId()!.toText();
    setWalletAccount(assetId, accountId);

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
    };

    navigate(ROOT["/"].integration["/"].pay["/"].checkout.path, { state: p });
  };

  const handleCheckoutBack = () => {
    window.close();
  };

  const handleConnectWallet = async (kind: TThirdPartyWalletKind) => {
    await connectWallet(kind);
    await initWallet([getAssetId()!.toText()]);
  };

  const connectedWalletIsThirdParty = () => {
    const connected = connectedWallet();

    // not entirely true, but will work for now
    if (!connected) return true;
    const [kind, _] = connected;

    return kind === "NNS" || kind === "Plug";
  };

  return (
    <Show when={isValidRequest()}>
      <PaymentPageContainer>
        <PaymentPageWrapper>
          <PaymentPageHeading>
            <Text size={20} weight={600}>
              Pending {getKind()}{" "}
              <Show when={getInitiatorOrigin()}>
                initiated by <span class={ColorAccent}>{originToHostname(getInitiatorOrigin()!)}</span>
              </Show>
            </Text>
            <Show when={getAssetId() && assetMetadata[getAssetId()!.toText()]?.metadata}>
              <H3>
                {tokensToStr(getAmount()!, assetMetadata[getAssetId()!.toText()]!.metadata!.decimals, undefined, true)}{" "}
                {assetMetadata[getAssetId()!.toText()]!.metadata!.symbol}
              </H3>
              <Show when={!connectedWallet()}>
                <button onClick={() => handleConnectWallet("MSQ")}>Connect MSQ</button>
                <button onClick={() => handleConnectWallet("NNS")}>Connect NNS</button>
                <button onClick={() => handleConnectWallet("Plug")}>Connect Plug</button>
              </Show>
            </Show>
          </PaymentPageHeading>
          <Show when={assets[getAssetId()!.toText()]?.accounts && assetMetadata[getAssetId()!.toText()]?.metadata}>
            <PaymentPageContent>
              <Text size={20} weight={600}>
                Select an account to continue:
              </Text>
              <PaymentPageAccountsWrapper>
                <PaymentPageAccounts>
                  <For each={assets[getAssetId()!.toText()]?.accounts}>
                    {(account, idx) => (
                      <AccountCard
                        classList={{ [AccountCardBase]: true, [AccountCardSelected]: idx() === selectedAccountId() }}
                        onClick={(accountId) => setSelectedAccountId(accountId)}
                        accountId={idx()}
                        assetId={getIcrc35Request<IICRC1TransferRequest>()!.payload.canisterId}
                        name={account.name}
                        balance={account.balance}
                        principal={account.principal}
                        decimals={assetMetadata[getAssetId()!.toText()]!.metadata!.decimals}
                        symbol={assetMetadata[getAssetId()!.toText()]!.metadata!.symbol}
                        targetBalance={getAmount()! + assetMetadata[getAssetId()!.toText()]!.metadata!.fee}
                      />
                    )}
                  </For>
                </PaymentPageAccounts>
                <Show when={!connectedWalletIsThirdParty()}>
                  <AddAccountBtn
                    disabled={loading()}
                    loading={loading()}
                    symbol={assetMetadata[getAssetId()!.toText()]!.metadata!.symbol}
                    onClick={() =>
                      handleAddAccount(
                        getAssetId()!.toText(),
                        assetMetadata[getAssetId()!.toText()]!.metadata!.name,
                        assetMetadata[getAssetId()!.toText()]!.metadata!.symbol,
                      )
                    }
                  />
                </Show>
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
                    (assets[getAssetId()!.toText()]!.accounts[selectedAccountId()].balance || 0n) >=
                    getAmount()! + assetMetadata[getAssetId()!.toText()]!.metadata!.fee
                  }
                  fallback={
                    <Button
                      label="top up the balance"
                      kind={EButtonKind.Secondary}
                      text="Top up the Balance"
                      icon={EIconKind.ArrowLeftDown}
                      onClick={() => handleReceive(selectedAccountId())}
                      disabled={assets[getAssetId()!.toText()]!.accounts[selectedAccountId()].principal === undefined}
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
