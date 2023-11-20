import { For, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import {
  AddAssetForm,
  AddAssetFormWrapper,
  AddAssetInput,
  AddAssetWrapper,
  AssetAccountsWrapper,
  AssetSpoilerContent,
  AssetSpoilerHeader,
  ErrorText,
  MyAssetsPageContent,
} from "./style";
import { Spoiler } from "../../../components/spoiler";
import { AccountCard } from "../../../components/account-card";
import {
  DEFAULT_PRINCIPAL,
  IAssetMetadata,
  ONE_MIN_MS,
  eventHandler,
  getAssetMetadata,
  makeAgent,
  makeAnonymousAgent,
  makeIcrc1Salt,
  tokensToStr,
} from "../../../utils";
import { Principal, TAccountId, debugStringify } from "@fort-major/masquerade-shared";
import { useLoader, useMasqueradeClient } from "../../../store/global";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";
import { AnonymousIdentity } from "@dfinity/agent";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { SetStoreFunction, produce } from "solid-js/store";
import { useNavigate } from "@solidjs/router";
import { ISendPageProps } from "./send";
import {
  H2,
  H4,
  H5,
  Span500,
  Span600,
  SpanError,
  SpanGray115,
  SpanGray130,
  Text12,
  Text20,
} from "../../../ui-kit/typography";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { IReceivePopupProps, ReceivePopup } from "./receive";
import { AddAccountBtn } from "../../../components/add-account-btn";
import { useAssetData, useSendPageProps } from "../../../store/assets";

export function MyAssetsPage() {
  const msq = useMasqueradeClient();
  const { assets, fetch, refresh, addAccount, editAccount, addAsset } = useAssetData();

  const [newAssetId, setNewAssetId] = createSignal<string>("");
  const [newAssetMetadata, setNewAssetMetadata] = createSignal<IAssetMetadata | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const [loading, setLoading] = createSignal(false);
  const [addingAccount, setAddingAccount] = createSignal(false);

  const [sendPopupProps, setSendPopupProps] = useSendPageProps();
  const [receivePopupProps, setReceivePopupProps] = createSignal<IReceivePopupProps | null>(null);

  const navigate = useNavigate();

  onMount(async () => {
    if (msq()) {
      await fetch();
      await refresh();
    }
  });

  const handleNewAssetIdInput = eventHandler(async (e: Event & { target: HTMLInputElement }) => {
    setNewAssetId(e.target.value.trim());
    setError(null);

    try {
      const principal = Principal.fromText(newAssetId());

      const existing = assets[newAssetId()];
      if (existing) {
        setError(`Token ${existing.metadata!.symbol} (${newAssetId()}) already exists`);
        return;
      }

      const agent = await makeAnonymousAgent();
      const ledger = IcrcLedgerCanister.create({ agent, canisterId: principal });

      const metadata = await getAssetMetadata(ledger, false);

      setNewAssetMetadata(metadata);
    } catch (e) {
      setError(`Invalid canister ID - ${debugStringify(e)}`);
    }
  });

  const handleEdit = async (assetId: string, accountId: TAccountId, newName: string) => {
    setLoading(true);
    await editAccount!(assetId, accountId, newName);
    setLoading(false);
  };

  const handleAddAccount = async (assetId: string, assetName: string, symbol: string) => {
    setLoading(true);
    setAddingAccount(true);

    await addAccount!(assetId, assetName, symbol);

    setLoading(false);
    setAddingAccount(false);
  };

  const handleAddAsset = async () => {
    const assetId = newAssetId();

    setLoading(true);

    try {
      addAsset!(assetId);
    } catch (e) {
      console.error(e);
      setError(`Token ${assetId} is not a valid ICRC-1 token or unresponsive`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (accountId: TAccountId, assetId: string) => {
    const assetData = assets[assetId]!;
    const account = assetData.accounts[accountId];

    const sendProps: ISendPageProps = {
      accountId,
      assetId,
      balance: account.balance!,
      name: account.name,
      principal: account.principal!,
      symbol: assetData.metadata!.symbol,
      decimals: assetData.metadata!.decimals,
      fee: assetData.metadata!.fee,

      onCancel: handleCancelSend,
    };

    setSendPopupProps(sendProps);
    navigate("/cabinet/my-assets/send");
  };

  const handleCancelSend = async (result: boolean) => {
    navigate("/cabinet/my-assets");

    const assetId = sendPopupProps()!.assetId;
    setSendPopupProps(undefined);

    if (result) {
      setLoading(true);

      await refresh!([assetId]);

      setLoading(false);
    }
  };

  const handleReceive = (symbol: string, principalId: string) => {
    setReceivePopupProps({
      principal: principalId,
      symbol,
      onClose: handleReceiveClose,
    });
  };

  const handleReceiveClose = () => {
    setReceivePopupProps(null);
  };

  return (
    <>
      <H2>My Assets</H2>
      <MyAssetsPageContent>
        <For
          each={Object.keys(assets)}
          fallback={
            <H5>
              <SpanGray115>No assets yet</SpanGray115>
            </H5>
          }
        >
          {(assetId) => (
            <Spoiler
              defaultOpen={
                !!assets[assetId] &&
                (assets[assetId]!.totalBalance > 0n || assets[assetId]!.accounts[0].name === "Creating...")
              }
              header={
                <AssetSpoilerHeader>
                  <Show
                    when={assets[assetId]?.metadata}
                    fallback={
                      <Text20>
                        <Span600>{assetId}</Span600>
                      </Text20>
                    }
                  >
                    <Text20>
                      <Span600>{assets[assetId]!.metadata!.name}</Span600>
                    </Text20>
                  </Show>
                  <Show
                    when={assets[assetId]?.metadata}
                    fallback={
                      <Text20>
                        <Span600>
                          0 <SpanGray130>TOK</SpanGray130>
                        </Span600>
                      </Text20>
                    }
                  >
                    <Text20>
                      <Span600>
                        {tokensToStr(
                          assets[assetId]!.totalBalance,
                          assets[assetId]!.metadata!.decimals,
                          undefined,
                          true,
                        )}{" "}
                        <SpanGray130>{assets[assetId]!.metadata!.symbol}</SpanGray130>
                      </Span600>
                    </Text20>
                  </Show>
                </AssetSpoilerHeader>
              }
            >
              <Show when={assets[assetId]?.metadata}>
                <AssetSpoilerContent>
                  <AssetAccountsWrapper>
                    <For each={assets[assetId]!.accounts}>
                      {(account, idx) => (
                        <AccountCard
                          accountId={idx()}
                          assetId={assetId}
                          name={account.name}
                          principal={account.principal}
                          balance={account.balance}
                          symbol={assets[assetId]!.metadata!.symbol}
                          decimals={assets[assetId]!.metadata!.decimals}
                          onSend={handleSend}
                          onReceive={handleReceive}
                          onEdit={(newName) => handleEdit(assetId, idx(), newName)}
                        />
                      )}
                    </For>
                  </AssetAccountsWrapper>
                  <AddAccountBtn
                    disabled={addingAccount()}
                    loading={addingAccount()}
                    onClick={() =>
                      handleAddAccount(assetId, assets[assetId]!.metadata!.name, assets[assetId]!.metadata!.symbol)
                    }
                    symbol={assets[assetId]!.metadata!.symbol}
                  />
                </AssetSpoilerContent>
              </Show>
            </Spoiler>
          )}
        </For>
        <AddAssetWrapper>
          <H4>Add custom ICRC-1 asset</H4>
          <AddAssetFormWrapper>
            <AddAssetForm>
              <AddAssetInput
                classList={{ error: error() !== null }}
                disabled={loading()}
                placeholder="Type token’s canister ID here..."
                value={newAssetId()}
                onInput={handleNewAssetIdInput}
              />
              <Button
                disabled={loading() || newAssetId() === "" || error() !== null || newAssetMetadata() === null}
                kind={EButtonKind.Primary}
                onClick={handleAddAsset}
                text={`Add ${
                  newAssetMetadata() ? `${newAssetMetadata()!.name} (${newAssetMetadata()!.symbol})` : "token"
                }`}
              />
            </AddAssetForm>
            <Show when={error()}>
              <Text12 class={ErrorText}>
                <SpanError>
                  <Span500>{error()}</Span500>
                </SpanError>
              </Text12>
            </Show>
          </AddAssetFormWrapper>
        </AddAssetWrapper>
      </MyAssetsPageContent>
      <Show when={receivePopupProps()}>
        <ReceivePopup {...receivePopupProps()!} />
      </Show>
    </>
  );
}
