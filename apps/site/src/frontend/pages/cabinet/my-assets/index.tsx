import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { AllAssetData, useAllAssetData, useSendPageProps } from "../../../store/cabinet";
import {
  AddAssetBtn,
  AddAssetForm,
  AddAssetFormWrapper,
  AddAssetHeader,
  AddAssetInput,
  AddAssetWrapper,
  AssetAccountsWrapper,
  AssetAddAccountBtn,
  AssetAddAccountBtnIconWrapper,
  AssetAddAccountBtnText,
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
  makeIcrc1Salt,
  tokensToStr,
} from "../../../utils";
import { Principal, TAccountId, debugStringify } from "@fort-major/masquerade-shared";
import { useIcAgent, useLoader, useMasqueradeClient } from "../../../store/global";
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
  Text16,
  Text20,
} from "../../../ui-kit/typography";
import { EIconKind, Icon } from "../../../ui-kit/icon";
import { Button, EButtonKind } from "../../../ui-kit/button";

export function MyAssetsPage() {
  const client = useMasqueradeClient();
  const [allAssetData, setAllAssetData, allAssetDataFetched, allAssetDataKeys] = useAllAssetData();
  const [newAssetId, setNewAssetId] = createSignal<string>("");
  const [newAssetMetadata, setNewAssetMetadata] = createSignal<IAssetMetadata | null>(null);
  const [error, setError] = createSignal<string | null>();

  const [loading, setLoading] = createSignal(false);
  const [addingAccount, setAddingAccount] = createSignal(false);

  const [sendPopupProps, setSendPopupProps] = useSendPageProps();

  const navigate = useNavigate();

  const [_, showLoader] = useLoader();
  createEffect(() => showLoader(!allAssetDataFetched()));

  const icAgent = useIcAgent();

  const [int] = createSignal(
    setInterval(async () => {
      const anonIdentity = new AnonymousIdentity();
      const agent = await makeAgent(anonIdentity);

      const assetIds = Object.keys(allAssetData);

      for (let assetId of assetIds) {
        if (allAssetData[assetId]?.metadata === undefined) continue;

        const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });
        const accounts = allAssetData[assetId]?.accounts || [];

        for (let accountId = 0; accountId < accounts.length; accountId++) {
          if (accounts[accountId].principal) updateBalanceOf(ledger, allAssetData, setAllAssetData, assetId, accountId);
        }
      }
    }, ONE_MIN_MS * 2),
  );

  onCleanup(() => clearInterval(int()));

  const handleNewAssetIdInput = eventHandler(async (e: Event & { target: HTMLInputElement }) => {
    setNewAssetId(e.target.value.trim());
    setError(null);

    try {
      const principal = Principal.fromText(newAssetId());

      const existing = allAssetData[newAssetId()];
      if (existing) {
        setError(`Token ${existing.metadata!.symbol} (${newAssetId()}) already exists`);
        return;
      }

      const ledger = IcrcLedgerCanister.create({ agent: icAgent()!, canisterId: principal });

      const metadata = await getAssetMetadata(ledger, false);

      setNewAssetMetadata(metadata);
    } catch (e) {
      setError(`Invalid canister ID - ${debugStringify(e)}`);
    }
  });

  const handleEdit = async (assetId: string, accountId: TAccountId, newName: string) => {
    setLoading(true);
    await client()!.editAssetAccount(assetId, accountId, newName);

    setAllAssetData(assetId, "accounts", accountId, "name", newName);
    setLoading(false);
  };

  const handleAddAccount = async (assetId: string, assetName: string, symbol: string) => {
    setLoading(true);
    setAddingAccount(true);

    const name = await client()!.addAssetAccount(assetId, assetName, symbol);

    if (name === null) {
      setLoading(false);
      setAddingAccount(false);

      return;
    }

    const accountId = allAssetData[assetId]!.accounts.length;

    setAllAssetData(assetId, "accounts", accountId, { name, balance: BigInt(0), principal: DEFAULT_PRINCIPAL });

    const identity = await MasqueradeIdentity.create(client()!.getInner(), makeIcrc1Salt(assetId, accountId));
    const principal = identity.getPrincipal();

    setAllAssetData(assetId, "accounts", accountId, "principal", principal.toText());

    const anonIdentity = new AnonymousIdentity();
    const agent = await makeAgent(anonIdentity);
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

    updateBalanceOf(ledger, allAssetData, setAllAssetData, assetId, accountId);

    setLoading(false);
    setAddingAccount(false);
  };

  const handleAddAsset = async () => {
    const assetId = newAssetId();

    setLoading(true);

    const msq = client()!;

    const anonIdentity = new AnonymousIdentity();
    const agent = await makeAgent(anonIdentity);
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

    try {
      // first we query to be fast
      let metadata = await getAssetMetadata(ledger, false);

      setAllAssetData(
        produce((state) => {
          state[assetId] = {
            metadata,
            totalBalance: 0n,
            accounts: [
              {
                name: "Creating...",
                balance: BigInt(0),
                principal: DEFAULT_PRINCIPAL,
              },
            ],
          };
        }),
      );

      // then we update to be sure
      metadata = await getAssetMetadata(ledger, true);
      const assetData = await msq.addAsset(assetId, metadata.name, metadata.symbol);

      setNewAssetId("");
      if (assetData === null) return;

      setAllAssetData(
        produce((state) => {
          state[assetId]!.metadata = metadata;
          state[assetId]!.accounts[0].name = assetData.accounts[0];
        }),
      );

      const identity = await MasqueradeIdentity.create(msq.getInner(), makeIcrc1Salt(assetId, 0));
      const principal = identity.getPrincipal();

      setAllAssetData(assetId, "accounts", 0, "principal", principal.toText());

      updateBalanceOf(ledger, allAssetData, setAllAssetData, assetId, 0);
    } catch (e) {
      console.error(e);
      setError(`Token ${assetId} is not a valid ICRC-1 token or unresponsive`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (accountId: TAccountId, assetId: string) => {
    const assetData = allAssetData[assetId]!;
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

    if (result) {
      setLoading(true);

      const anonIdentity = new AnonymousIdentity();
      const agent = await makeAgent(anonIdentity);
      const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(sendPopupProps()!.assetId) });

      const accounts = allAssetData[sendPopupProps()!.assetId]!.accounts;

      for (let accountId = 0; accountId < accounts.length; accountId++) {
        await updateBalanceOf(ledger, allAssetData, setAllAssetData, sendPopupProps()!.assetId, accountId);
      }

      setLoading(false);
    }

    setSendPopupProps(undefined);
  };

  createEffect(() => {
    console.log(loading(), newAssetId(), newAssetMetadata(), error());
  });

  return (
    <>
      <H2>My Assets</H2>
      <MyAssetsPageContent>
        <For
          each={allAssetDataKeys()}
          fallback={
            <H5>
              <SpanGray115>No assets yet</SpanGray115>
            </H5>
          }
        >
          {(assetId) => (
            <Spoiler
              defaultOpen={
                !!allAssetData[assetId] &&
                (allAssetData[assetId]!.totalBalance > 0n || allAssetData[assetId]!.accounts[0].name === "Creating...")
              }
              header={
                <AssetSpoilerHeader>
                  <Show
                    when={allAssetData[assetId]?.metadata}
                    fallback={
                      <Text20>
                        <Span600>{assetId}</Span600>
                      </Text20>
                    }
                  >
                    <Text20>
                      <Span600>{allAssetData[assetId]!.metadata!.name}</Span600>
                    </Text20>
                  </Show>
                  <Show
                    when={allAssetData[assetId]?.metadata}
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
                        {tokensToStr(allAssetData[assetId]!.totalBalance, allAssetData[assetId]!.metadata!.decimals)}{" "}
                        <SpanGray130>{allAssetData[assetId]!.metadata!.symbol}</SpanGray130>
                      </Span600>
                    </Text20>
                  </Show>
                </AssetSpoilerHeader>
              }
            >
              <Show when={allAssetData[assetId]?.metadata}>
                <AssetSpoilerContent>
                  <AssetAccountsWrapper>
                    <For each={allAssetData[assetId]!.accounts}>
                      {(account, idx) => (
                        <AccountCard
                          accountId={idx()}
                          assetId={assetId}
                          name={account.name}
                          principal={account.principal}
                          balance={account.balance}
                          symbol={allAssetData[assetId]!.metadata!.symbol}
                          decimals={allAssetData[assetId]!.metadata!.decimals}
                          onSend={handleSend}
                          onReceive={() => {}}
                          onEdit={(newName) => handleEdit(assetId, idx(), newName)}
                        />
                      )}
                    </For>
                  </AssetAccountsWrapper>
                  <AssetAddAccountBtn
                    disabled={addingAccount()}
                    onClick={eventHandler(() =>
                      handleAddAccount(
                        assetId,
                        allAssetData[assetId]!.metadata!.name,
                        allAssetData[assetId]!.metadata!.symbol,
                      ),
                    )}
                  >
                    <AssetAddAccountBtnIconWrapper>
                      <Icon kind={addingAccount() ? EIconKind.Loader : EIconKind.Plus} />
                    </AssetAddAccountBtnIconWrapper>
                    <Text16>
                      <Span600>Add New {allAssetData[assetId]!.metadata!.symbol} Account</Span600>
                    </Text16>
                  </AssetAddAccountBtn>
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
    </>
  );
}

async function updateBalanceOf(
  ledger: IcrcLedgerCanister,
  allAssetData: AllAssetData,
  setAllAssetData: SetStoreFunction<AllAssetData>,
  assetId: string,
  accountId: number,
) {
  // first we query to be fast
  let balance = await ledger.balance({
    certified: false,
    owner: Principal.fromText(allAssetData[assetId]!.accounts[accountId].principal!),
  });

  setAllAssetData(
    produce((state) => {
      state[assetId]!.accounts[accountId].balance = balance;
      const totalBalance = state[assetId]!.accounts!.reduce((prev, cur) => prev + (cur.balance || 0n), 0n);

      state[assetId]!.totalBalance = totalBalance;
    }),
  );

  // then we update to be sure
  balance = await ledger.balance({
    certified: true,
    owner: Principal.fromText(allAssetData[assetId]!.accounts[accountId].principal!),
  });

  setAllAssetData(
    produce((state) => {
      state[assetId]!.accounts[accountId].balance = balance;
      const totalBalance = state[assetId]!.accounts!.reduce((prev, cur) => prev + (cur.balance || 0n), 0n);

      state[assetId]!.totalBalance = totalBalance;
    }),
  );
}
