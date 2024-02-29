import { For, Show, createEffect, createSignal } from "solid-js";
import {
  AddAssetForm,
  AddAssetFormWrapper,
  AddAssetInput,
  AddAssetWrapper,
  AssetAccountsWrapper,
  AssetLogo,
  AssetSpoilerContent,
  AssetSpoilerHeader,
  ErrorText,
  MyAssetsPageContent,
  MyAssetsPageHeader,
  MyAssetsShowEmptyToggle,
  NameAndLogo,
} from "./style";
import { Spoiler } from "../../../components/spoiler";
import { AccountCard } from "../../../components/account-card";
import {
  createLocalStorageSignal,
  IAssetMetadata,
  eventHandler,
  getAssetMetadata,
  makeAnonymousAgent,
  tokensToStr,
} from "../../../utils";
import { Principal, TAccountId, debugStringify, logError } from "@fort-major/msq-shared";
import { useMsqClient } from "../../../store/global";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { useNavigate } from "@solidjs/router";
import { ISendPageProps } from "./send";
import { ColorGray115, ColorGray130, H2, H4, H5, Text } from "../../../ui-kit/typography";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { IReceivePopupProps, ReceivePopup } from "./receive";
import { AddAccountBtn } from "../../../components/add-account-btn";
import { useAssetData, useSendPageProps, useTxnHistoryPageProps } from "../../../store/assets";
import { COLOR_ERROR_RED, COLOR_WHITE, CabinetContent, CabinetPage, FONT_WEIGHT_SEMI_BOLD } from "../../../ui-kit";
import { CabinetNav } from "../../../components/cabinet-nav";
import { ContactUsBtn } from "../../../components/contact-us-btn";
import { ITxnHistoryModalProps, TxnHistoryModal } from "../../../components/txn-history-modal";
import { Toggle } from "../../../components/toggle";

export function MyAssetsPage() {
  const msq = useMsqClient();
  const { assets, init, refresh, addAccount, editAccount, addAsset, removeAssetLogo } = useAssetData();

  const [newAssetId, setNewAssetId] = createSignal<string>("");
  const [newAssetMetadata, setNewAssetMetadata] = createSignal<IAssetMetadata | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const [loading, setLoading] = createSignal(false);
  const [addingAccount, setAddingAccount] = createSignal(false);

  const [sendPopupProps, setSendPopupProps] = useSendPageProps();
  const [receivePopupProps, setReceivePopupProps] = createSignal<IReceivePopupProps | null>(null);

  const [txnHistoryPopupProps, setTxnHistoryPopupProps] = createSignal<ITxnHistoryModalProps | null>(null);
  const [_, setTxnHistoryPageProps] = useTxnHistoryPageProps();

  const navigate = useNavigate();

  createEffect(() => {
    if (msq()) init();
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
    document.body.style.cursor = "wait";
    await editAccount!(assetId, accountId, newName);
    document.body.style.cursor = "unset";
    setLoading(false);
  };

  const handleAddAccount = async (assetId: string, assetName: string, symbol: string) => {
    setLoading(true);
    setAddingAccount(true);
    document.body.style.cursor = "wait";

    await addAccount!(assetId, assetName, symbol);

    document.body.style.cursor = "unset";
    setLoading(false);
    setAddingAccount(false);
  };

  const handleAddAsset = async () => {
    const assetId = newAssetId();

    setLoading(true);
    document.body.style.cursor = "wait";

    try {
      addAsset!(assetId);
    } catch (e) {
      logError(e);
      setError(`Token ${assetId} is not a valid ICRC-1 token or unresponsive`);
    } finally {
      document.body.style.cursor = "unset";
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

      onComplete: handleCancelSend,
      onCancel: () => handleCancelSend(false),
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
      document.body.style.cursor = "wait";

      await refresh!([assetId]);

      document.body.style.cursor = "unset";
      setLoading(false);
    }
  };

  const handleReceive = (assetId: string, symbol: string, principalId: string) => {
    setReceivePopupProps({
      assetId,
      principal: principalId,
      symbol,
      onClose: handleReceiveClose,
    });
  };

  const handleReceiveClose = () => {
    setReceivePopupProps(null);
  };

  const handleTxnHistoryPopupClose = () => {
    setTxnHistoryPopupProps(null);
  };

  const handleTxnHistoryPageClose = () => {
    setTxnHistoryPageProps(undefined);
  };

  const [hideEmpty, setHideEmpty] = createLocalStorageSignal<boolean>("msq-assets-hide-empty");

  const getAssetKeys = () =>
    Object.keys(assets).filter((key) => (hideEmpty() ? (assets[key]?.totalBalance ?? 0) > 0 : true));

  return (
    <CabinetPage>
      <CabinetNav />
      <CabinetContent>
        <MyAssetsPageHeader>
          <H2>My Assets</H2>
          <MyAssetsShowEmptyToggle>
            <Toggle defaultValue={hideEmpty()} onToggle={setHideEmpty} />
            <Text size={16} weight={FONT_WEIGHT_SEMI_BOLD} letterSpacing={-1} color={COLOR_WHITE}>
              Hide Empty
            </Text>
          </MyAssetsShowEmptyToggle>
        </MyAssetsPageHeader>
        <MyAssetsPageContent>
          <For
            each={getAssetKeys()}
            fallback={
              <H5>
                <span class={ColorGray115}>No assets yet</span>
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
                        <Text size={20} weight={600}>
                          {assetId}
                        </Text>
                      }
                    >
                      <NameAndLogo>
                        <Show when={assets[assetId]!.metadata!.logoSrc}>
                          <AssetLogo
                            onError={() => removeAssetLogo(assetId)}
                            src={assets[assetId]!.metadata!.logoSrc}
                            alt="logo"
                          />
                        </Show>
                        <Text size={20} weight={600}>
                          {assets[assetId]!.metadata!.name}
                        </Text>
                      </NameAndLogo>
                    </Show>
                    <Show
                      when={assets[assetId]?.metadata}
                      fallback={
                        <Text size={20} weight={600}>
                          0 <span class={ColorGray130}>TOK</span>
                        </Text>
                      }
                    >
                      <Text size={20} weight={600}>
                        {tokensToStr(
                          assets[assetId]!.totalBalance,
                          assets[assetId]!.metadata!.decimals,
                          undefined,
                          true,
                        )}{" "}
                        <span class={ColorGray130}>{assets[assetId]!.metadata!.symbol}</span>
                      </Text>
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
                            onDetailsClick={
                              account.principal
                                ? () =>
                                    setTxnHistoryPopupProps({
                                      tokenId: assetId,
                                      accountPrincipalId: account.principal!,
                                      symbol: assets[assetId]!.metadata!.symbol,
                                      decimals: assets[assetId]!.metadata!.decimals,
                                      onClose: handleTxnHistoryPopupClose,
                                      onShowMore: () => {
                                        setTxnHistoryPageProps({
                                          tokenId: assetId,
                                          accountName: account.name,
                                          accountPrincipalId: account.principal!,
                                          accountBalance: account.balance ?? 0n,
                                          decimals: assets[assetId]!.metadata!.decimals,
                                          symbol: assets[assetId]!.metadata!.symbol,
                                          onClose: handleTxnHistoryPageClose,
                                        });

                                        navigate("/cabinet/my-assets/history");
                                      },
                                    })
                                : undefined
                            }
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
                  label="add token"
                  disabled={loading() || newAssetId() === "" || error() !== null || newAssetMetadata() === null}
                  kind={EButtonKind.Primary}
                  onClick={handleAddAsset}
                  text={`Add ${
                    newAssetMetadata() ? `${newAssetMetadata()!.name} (${newAssetMetadata()!.symbol})` : "token"
                  }`}
                />
              </AddAssetForm>
              <Show when={error()}>
                <Text size={12} weight={500} color={COLOR_ERROR_RED} class={ErrorText}>
                  {error()}
                </Text>
              </Show>
            </AddAssetFormWrapper>
          </AddAssetWrapper>
        </MyAssetsPageContent>
        <Show when={receivePopupProps()}>
          <ReceivePopup {...receivePopupProps()!} />
        </Show>
        <Show when={txnHistoryPopupProps()}>
          <TxnHistoryModal {...txnHistoryPopupProps()!} />
        </Show>
      </CabinetContent>

      <ContactUsBtn />
    </CabinetPage>
  );
}
