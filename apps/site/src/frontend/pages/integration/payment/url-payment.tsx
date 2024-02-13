import { ErrorCode, Principal, TAccountId, err } from "@fort-major/msq-shared";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { useMsqClient } from "../../../store/global";
import { useAssetData, useSendPageProps } from "../../../store/assets";
import { IReceivePopupProps, ReceivePopup } from "../../cabinet/my-assets/receive";
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
import { H3, Text } from "../../../ui-kit/typography";
import { tokensToStr } from "../../../utils";
import { AccountCard } from "../../../components/account-card";
import { AddAccountBtn } from "../../../components/add-account-btn";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { ContactUsBtn } from "../../../components/contact-us-btn";
import { ISendPageProps } from "../../cabinet/my-assets/send";

interface ITransferRequestSearchParams {
  kind?: "t" | "d";
  "canister-id": string;
  "to-principal": string;
  "to-subaccount"?: string;
  memo?: string;
  amount?: string;
}

interface UrlBasedICRC1TransferRequest {
  kind: "transfer" | "donation";
  canisterId: string;
  to: {
    owner: Principal;
    subaccount?: string;
  };
  memo?: string;
  amount?: bigint;
}

export function UrlBasedPaymentPage() {
  const msq = useMsqClient();
  const { assets, fetch, refresh, addAsset, addAccount } = useAssetData();
  const [selectedAccountId, setSelectedAccountId] = createSignal<TAccountId>(0);
  const [receivePopupProps, setReceivePopupProps] = createSignal<IReceivePopupProps | null>(null);
  const [sendPageProps, setSendPageProps] = useSendPageProps();
  const navigate = useNavigate();

  const transferRequest = createMemo(() => {
    const [searchParams] = useSearchParams() as unknown as [ITransferRequestSearchParams];
    if (!searchParams["canister-id"] || !searchParams["to-principal"]) return undefined;

    // inputs are validated here or later for principals
    const req: UrlBasedICRC1TransferRequest = {
      kind: searchParams.kind === "d" ? "donation" : "transfer",
      canisterId: searchParams["canister-id"],
      to: {
        owner: Principal.fromText(searchParams["to-principal"]),
        subaccount: searchParams["to-subaccount"],
      },
      memo: searchParams.memo,
      amount: searchParams.amount ? BigInt(searchParams.amount) : undefined,
    };

    return req;
  });

  const [loading, setLoading] = createSignal(false);

  const getAssetId = () => transferRequest()?.canisterId;

  createEffect(async () => {
    if (!transferRequest()) {
      navigate("/404");
      return;
    }

    if (transferRequest() && msq()) {
      const assetId = getAssetId()!;

      const result = await fetch([assetId]);

      // propose the user to add the asset canister ID will be validated here
      if (!result || !result[0]) {
        await addAsset!(assetId);
      }

      // validate other inputs
      if (transferRequest()!.amount && transferRequest()!.amount! < 0n) {
        err(ErrorCode.INVALID_INPUT, `Amount is less than zero: ${transferRequest()!.amount}`);
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

  const handleCompleteSend = () => {
    navigate("/cabinet/my-assets", { replace: true });
    setSendPageProps(undefined);
  };

  const handleCancelSend = () => {
    window.history.back();
    setSendPageProps(undefined);
  };

  const handleCheckoutStart = (accountId: TAccountId) => {
    const assetId = getAssetId()!;

    const p: ISendPageProps = {
      accountId,
      name: assets[assetId]!.accounts[accountId].name,
      balance: assets[assetId]!.accounts[accountId].balance!,
      principal: assets[assetId]!.accounts[accountId].principal!,

      assetId,
      symbol: assets[assetId]!.metadata!.symbol,
      decimals: assets[assetId]!.metadata!.decimals,
      fee: assets[assetId]!.metadata!.fee,

      onCancel: handleCancelSend,
      onComplete: handleCompleteSend,

      default: {
        recepientPrincipal: transferRequest()!.to.owner,
        recepientSubaccount: transferRequest()!.to.subaccount,
        memo: transferRequest()!.memo,
        amount: transferRequest()!.amount,
      },
    };

    setSendPageProps(p);
    navigate("/pay/send");
  };

  return (
    <Show when={transferRequest()}>
      <PaymentPageContainer>
        <PaymentPageWrapper>
          <PaymentPageHeading>
            <Text size={20} weight={600}>
              Pending {transferRequest()!.kind} request
            </Text>
            <Show when={getAssetId() && assets[getAssetId()!]?.metadata}>
              <Show
                when={transferRequest()?.amount}
                fallback={<H3>Any {assets[getAssetId()!]!.metadata!.symbol} amount</H3>}
              >
                <H3>
                  {tokensToStr(transferRequest()!.amount!, assets[getAssetId()!]!.metadata!.decimals, undefined, true)}{" "}
                  {assets[getAssetId()!]!.metadata!.symbol}
                </H3>
              </Show>
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
                        assetId={transferRequest()!.canisterId}
                        name={account.name}
                        balance={account.balance}
                        principal={account.principal}
                        decimals={assets[getAssetId()!]!.metadata!.decimals}
                        symbol={assets[getAssetId()!]!.metadata!.symbol}
                        targetBalance={(transferRequest()!.amount || 0n) + assets[getAssetId()!]!.metadata!.fee}
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
                      transferRequest()!.canisterId,
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
                  onClick={handleCompleteSend}
                  text="Dismiss"
                  fullWidth
                />
                <Show
                  when={
                    (assets[getAssetId()!]!.accounts[selectedAccountId()].balance || 0n) >=
                    (transferRequest()!.amount || 0n) + assets[getAssetId()!]!.metadata!.fee
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
                    label="continue"
                    kind={EButtonKind.Primary}
                    text="Continue"
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
