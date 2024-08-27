import { For, Match, Show, Switch, createEffect, createMemo, createSignal, on, onCleanup, onMount } from "solid-js";
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
import { Block, Img } from "../../../components/markup";
import { Plate } from "../../../components/plate";
import { COLOR_GRAY_115, COLOR_GRAY_140, COLOR_GRAY_190, COLOR_ORANGE, COLOR_WHITE } from "../../../ui-kit";
import { eventHandler } from "../../../utils";
import { Checkbox } from "../../../ui-kit/checkbox";
import { Warning } from "../../../ui-kit/warning";
import { Copyable } from "../../../ui-kit/copyable";

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
  const [pageState, setPageState] = createSignal<"account-select" | "wallet-select">("wallet-select");

  const { assets, assetMetadata, fetchMetadata, fetchAccountInfo, refreshBalances, addAsset, addAccount } =
    useAssetData();
  const { getIcrc35Request } = useICRC35Store();
  const navigate = useNavigate();
  const { connectWallet, disconnectWallet, initWallet, connectedWallet, setWalletAccount } = useThirdPartyWallet();

  const icrc35BasedPaymentRequest = () => getIcrc35Request<IICRC1TransferRequest>();

  const urlBasedPaymentRequest = createMemo(() => {
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
    getIcrc35Request() ? "icrc-35" : urlBasedPaymentRequest() ? "url" : undefined;

  const getAssetId = () => {
    try {
      switch (mode()) {
        case "icrc-35":
          return Principal.fromText(icrc35BasedPaymentRequest()!.payload.canisterId);
        case "url":
          return Principal.fromText(urlBasedPaymentRequest()!.canisterId);
      }
    } catch (e) {
      console.error(e);
      return undefined;
    }
  };

  const getKind = (): "payment" | "transfer" | "donation" | undefined => {
    switch (mode()) {
      case "icrc-35":
        return "payment";
      case "url":
        return urlBasedPaymentRequest()!.kind;
    }
  };

  const getToPrincipal = () => {
    try {
      switch (mode()) {
        case "icrc-35":
          return Principal.fromText(icrc35BasedPaymentRequest()!.payload.to.owner);
        case "url":
          return Principal.fromText(urlBasedPaymentRequest()!.to.owner);
      }
    } catch {
      return undefined;
    }
  };

  const getToSubaccount = () => {
    switch (mode()) {
      case "icrc-35":
        return icrc35BasedPaymentRequest()!.payload.to.subaccount;
      case "url":
        return urlBasedPaymentRequest()!.to.subaccount
          ? hexToBytes(urlBasedPaymentRequest()!.to.subaccount!)
          : undefined;
    }
  };

  const getMemo = () => {
    switch (mode()) {
      case "icrc-35":
        return icrc35BasedPaymentRequest()!.payload.memo;
      case "url":
        return urlBasedPaymentRequest()!.memo ? hexToBytes(urlBasedPaymentRequest()!.memo!) : undefined;
    }
  };

  const getAmount = () => {
    let amount: bigint;

    switch (mode()) {
      case "icrc-35":
        amount = icrc35BasedPaymentRequest()!.payload.amount;
        break;
      case "url":
        amount = urlBasedPaymentRequest()!.amount;
        break;

      default:
        amount = 0n;
    }

    if (amount > 0n) return amount;
    return undefined;
  };

  const getMetadata = () => {
    const assetId = getAssetId()?.toText();
    if (!assetId) return undefined;

    const metadata = assetMetadata[assetId];
    if (!metadata) return undefined;

    return metadata;
  };

  const getAmountToTransfer = () => {
    const qty = getAmount();
    if (!qty) return undefined;

    const meta = getMetadata();
    if (!meta) return undefined;

    return qty + meta.metadata.fee;
  };

  const getCreatedAt = () => {
    switch (mode()) {
      case "icrc-35":
        return icrc35BasedPaymentRequest()!.payload.createdAt;
      default:
        return undefined;
    }
  };

  const isValidRequest = () => {
    console.log(getAssetId(), getToPrincipal(), getAmount(), icrc35BasedPaymentRequest(), urlBasedPaymentRequest());

    return getAssetId() !== undefined && getToPrincipal() !== undefined && getAmount() !== undefined;
  };

  const getInitiatorOrigin = () => {
    switch (mode()) {
      case "icrc-35":
        return icrc35BasedPaymentRequest()!.peerOrigin;
      case "url":
        return window.document.referrer ? new URL(window.document.referrer).origin : window.location.origin;
      default:
        return window.location.origin;
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

    const p: IPaymentCheckoutPageProps = {
      accountId,
      accountName: asset.accounts[accountId].name,
      accountBalance: asset.accounts[accountId].balance!,
      accountPrincipal: asset.accounts[accountId].principal,

      assetId,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
      fee: metadata.fee,

      peerOrigin: getInitiatorOrigin(),

      amount: getAmount()!,
      recepientPrincipal: getToPrincipal()!.toText(),
      recepientSubaccount: getToSubaccount(),
      memo: getMemo(),
      createdAt: getCreatedAt(),
    };

    navigate(ROOT["/"].integration["/"].pay["/"].checkout.path, { state: p });
  };

  const handleWalletSelectBack = () => {
    window.close();
  };

  const handleAccountSelectBack = () => {
    disconnectWallet();
    setPageState("wallet-select");
  };

  const handleConnectWallet = async (kind: TThirdPartyWalletKind) => {
    await connectWallet(kind);
    await initWallet([getAssetId()!.toText()]);

    setPageState("account-select");
  };

  const connectedWalletIsThirdParty = () => {
    const connected = connectedWallet();

    // not entirely true, but will work for now
    if (!connected) return true;
    const [kind, _] = connected;

    return kind === "NNS" || kind === "Plug";
  };

  const supportedWallets: ["MSQ", "Plug", "NNS"] = ["MSQ", "Plug", "NNS"];

  return (
    <Show when={isValidRequest()}>
      <PaymentPageContainer>
        <PaymentPageWrapper>
          <PaymentPageHeading>
            <Text size={20} weight={600}>
              Pending {getKind()} request{" "}
              <Show when={getInitiatorOrigin()}>
                initiated by <span class={ColorAccent}>{originToHostname(getInitiatorOrigin()!)}</span>
              </Show>
            </Text>
            <Show when={getAssetId() && assetMetadata[getAssetId()!.toText()]?.metadata}>
              <H3>
                {tokensToStr(getAmount()!, assetMetadata[getAssetId()!.toText()]!.metadata!.decimals, undefined, true)}{" "}
                {assetMetadata[getAssetId()!.toText()]!.metadata!.symbol}
              </H3>
            </Show>
          </PaymentPageHeading>

          <Show when={pageState() === "wallet-select"}>
            <Block gap="40px" flow="column" items="stretch">
              <Block gap="25px" flow="column" items="stretch">
                <Text size={20} weight={600}>
                  Select a wallet to pay with:
                </Text>
                <Block flow="column" items="stretch">
                  <For each={supportedWallets}>
                    {(walletName) => (
                      <Plate pointer bgHover onClick={eventHandler(() => handleConnectWallet(walletName))}>
                        <Block gap="15px" items="center">
                          <Img src={`/assets/${walletName.toLowerCase()}-wallet.png`} w="50px" h="50px" rounded />
                          <Block flow="column" gap="15px">
                            <Text size={16} weight={600} color={COLOR_WHITE}>
                              {walletName}
                            </Text>
                            <Text size={12} weight={500} color={COLOR_GRAY_140}>
                              <Switch>
                                <Match when={walletName === "MSQ"}>MetaMask-based Safe ICP Wallet</Match>
                                <Match when={walletName === "NNS"}>Use Internet Identity to pay via the NNS dapp</Match>
                                <Match when={walletName === "Plug"}>IC Wallet by Funded</Match>
                              </Switch>
                            </Text>
                          </Block>
                        </Block>
                      </Plate>
                    )}
                  </For>
                </Block>
              </Block>
              <Button kind={EButtonKind.Additional} text="Dismiss" label="dismiss" onClick={handleWalletSelectBack} />
            </Block>
          </Show>

          <Show
            when={
              pageState() === "account-select" &&
              connectedWallet() &&
              assets[getAssetId()!.toText()]?.accounts &&
              assetMetadata[getAssetId()!.toText()]?.metadata
            }
          >
            <PaymentPageContent>
              <Text size={20} weight={600}>
                <Switch>
                  <Match when={connectedWallet()![0] === "MSQ"}>Select an account to continue:</Match>
                  <Match when={connectedWallet()![0] === "NNS"}>
                    Refill with{" "}
                    <a href="https://nns.ic0.app" style={{ "text-decoration": "underline" }} class={ColorAccent}>
                      NNS Dapp
                    </a>{" "}
                    (or other) to continue:
                  </Match>
                </Switch>
              </Text>
              <PaymentPageAccountsWrapper>
                <PaymentPageAccounts grid={connectedWallet()![0] === "MSQ"}>
                  <For each={assets[getAssetId()!.toText()]?.accounts}>
                    {(account, idx) => (
                      <AccountCard
                        fullWidth
                        showWalletKindLogo={connectedWallet()![0]}
                        classList={{ [AccountCardBase]: true, [AccountCardSelected]: idx() === selectedAccountId() }}
                        onClick={(accountId) => setSelectedAccountId(accountId)}
                        accountId={idx()}
                        assetId={getAssetId()!.toText()}
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
                <Show when={connectedWallet()![0] === "NNS" && getAmountToTransfer() !== undefined}>
                  <Block flow="column" items="stretch">
                    <Warning iconBgColor={COLOR_GRAY_190}>
                      <Block gap="5px" items="center">
                        <Text weight={500} size={16}>
                          Mare sure to transfer exactly
                        </Text>
                        <Copyable
                          text={tokensToStr(getAmountToTransfer()!, getMetadata()!.metadata.decimals)}
                          after={getMetadata()!.metadata.symbol}
                        />
                        <Text weight={500} size={16}>
                          , otherwise you won't be able to complete the payment.
                        </Text>
                      </Block>
                    </Warning>
                    <Warning iconBgColor={COLOR_ORANGE}>
                      <Block gap="5px" items="center">
                        <Text weight={500} size={16}>
                          Make sure your wallet supports ICRC-1 transfers, otherwise your funds may be lost.
                        </Text>
                      </Block>
                    </Warning>
                  </Block>
                </Show>
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
                  onClick={handleAccountSelectBack}
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
