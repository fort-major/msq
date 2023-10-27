import { For, Show, createEffect, createSignal, on } from "solid-js";
import { makeIcrc1Salt, useAllAssetData } from "../../../store/cabinet";
import { CabinetHeading } from "../../../styles";
import {
  AddAssetBtn,
  AddAssetForm,
  AddAssetHeader,
  AddAssetInput,
  AddAssetWrapper,
  AssetAccountsWrapper,
  AssetAddAccountBtn,
  AssetAddAccountBtnIconWrapper,
  AssetAddAccountBtnText,
  AssetSpoilerContent,
  AssetSpoilerHeader,
  MyAssetsPageContent,
} from "./style";
import { Spoiler } from "../../../components/spoiler";
import { Dim, Title } from "../../../components/typography/style";
import { AccountCard } from "../../../components/account-card";
import { DEFAULT_PRINCIPAL, assertEventSafe, getAssetMetadata, makeAgent, tokensToStr } from "../../../utils";
import { Principal, TAccountId } from "@fort-major/masquerade-shared";
import { useLoader, useMasqueradeClient } from "../../../store/global";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";
import { AnonymousIdentity } from "@dfinity/agent";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { PlusIcon } from "../../../components/typography/icons";

export function MyAssetsPage() {
  const client = useMasqueradeClient();
  const [allAssetData, setAllAssetData, allAssetDataFetched, allAssetDataKeys] = useAllAssetData();
  const [newAssetId, setNewAssetId] = createSignal<string>("");
  const [error, setError] = createSignal<string | undefined>();

  const [_, showLoader] = useLoader();
  createEffect(() => showLoader(!allAssetDataFetched()));

  const handleEdit = async (assetId: string, accountId: TAccountId, newName: string) => {
    await client()!.editAssetAccount(assetId, accountId, newName);

    setAllAssetData(assetId, "accounts", accountId, "name", newName);
  };

  const handleAddAccount = async (assetId: string, assetName: string, symbol: string) => {
    const name = await client()!.addAssetAccount(assetId, assetName, symbol);

    if (name === null) return;

    const accountId = allAssetData[assetId]!.accounts.length;

    setAllAssetData(assetId, "accounts", accountId, { name });

    const identity = await MasqueradeIdentity.create(client()!.getInner(), makeIcrc1Salt(assetId, accountId));
    const principal = identity.getPrincipal();

    setAllAssetData(assetId, "accounts", accountId, "principal", principal.toText());

    const anonIdentity = new AnonymousIdentity();
    const agent = await makeAgent(anonIdentity);
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

    const balance = await ledger.balance({ certified: true, owner: principal });

    setAllAssetData(assetId, "accounts", accountId, "balance", balance);
  };

  const handleAddAsset = async (e: Event) => {
    assertEventSafe(e);

    const assetId = newAssetId();

    const existing = allAssetData[assetId];
    if (existing) {
      setError(`Token ${existing.metadata?.name} (${assetId}) already exists`);
      return;
    }

    const msq = client()!;

    const anonIdentity = new AnonymousIdentity();
    const agent = await makeAgent(anonIdentity);
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

    try {
      const metadata = await getAssetMetadata(ledger, assetId);
      const assetData = await msq.addAsset(assetId, metadata.name, metadata.symbol);

      setNewAssetId("");
      if (assetData === null) return;

      setAllAssetData(assetId, { metadata });
      setAllAssetData(assetId, "accounts", 0, {
        name: assetData.accounts[0],
        balance: BigInt(0),
        principal: DEFAULT_PRINCIPAL,
      });

      const identity = await MasqueradeIdentity.create(msq.getInner(), makeIcrc1Salt(assetId, 0));
      const principal = identity.getPrincipal();

      setAllAssetData(assetId, "accounts", 0, "principal", principal.toText());

      const balance = await ledger.balance({ certified: true, owner: principal });

      setAllAssetData(assetId, "totalBalance", balance);
      setAllAssetData(assetId, "accounts", 0, "balance", balance);
    } catch (e) {
      console.error(e);
      setError(`Token ${assetId} is not a valid ICRC-1 token or unresponsive`);
    }
  };

  return (
    <>
      <CabinetHeading>My Assets</CabinetHeading>
      <MyAssetsPageContent>
        <For each={allAssetDataKeys()}>
          {(assetId) => (
            <Show when={allAssetData[assetId] !== null} fallback={<p>Token canister {assetId} does not respond...</p>}>
              <Spoiler
                header={
                  <AssetSpoilerHeader>
                    <Show when={allAssetData[assetId]!.metadata} fallback={<Title>{assetId}</Title>}>
                      <Title>{allAssetData[assetId]!.metadata!.name}</Title>
                    </Show>
                    <Show
                      when={allAssetData[assetId]!.metadata}
                      fallback={
                        <Title>
                          0 <Dim>TOK</Dim>
                        </Title>
                      }
                    >
                      <Title>
                        {tokensToStr(allAssetData[assetId]!.totalBalance, allAssetData[assetId]!.metadata!.decimals)}{" "}
                        <Dim>{allAssetData[assetId]!.metadata!.symbol}</Dim>
                      </Title>
                    </Show>
                  </AssetSpoilerHeader>
                }
              >
                <Show when={allAssetData[assetId]!.metadata}>
                  <AssetSpoilerContent>
                    <AssetAccountsWrapper>
                      <For each={allAssetData[assetId]!.accounts}>
                        {(account, idx) => (
                          <AccountCard
                            accountId={idx()}
                            name={account.name}
                            principal={account.principal}
                            balance={account.balance}
                            symbol={allAssetData[assetId]!.metadata!.symbol}
                            decimals={allAssetData[assetId]!.metadata!.decimals}
                            onSend={() => {}}
                            onReceive={() => {}}
                            onEdit={(newName) => handleEdit(assetId, idx(), newName)}
                          />
                        )}
                      </For>
                    </AssetAccountsWrapper>
                    <AssetAddAccountBtn
                      onClick={() =>
                        handleAddAccount(
                          assetId,
                          allAssetData[assetId]!.metadata!.name,
                          allAssetData[assetId]!.metadata!.symbol,
                        )
                      }
                    >
                      <AssetAddAccountBtnIconWrapper>
                        <PlusIcon />
                      </AssetAddAccountBtnIconWrapper>
                      <AssetAddAccountBtnText>
                        Add New {allAssetData[assetId]!.metadata!.symbol} Account
                      </AssetAddAccountBtnText>
                    </AssetAddAccountBtn>
                  </AssetSpoilerContent>
                </Show>
              </Spoiler>
            </Show>
          )}
        </For>
        <AddAssetWrapper>
          <AddAssetHeader>Add custom ICRC-1 asset</AddAssetHeader>
          <AddAssetForm>
            <AddAssetInput
              placeholder="Type token’s canister ID here..."
              value={newAssetId()}
              onInput={(e) => setNewAssetId(e.target.value)}
            />
            <AddAssetBtn onClick={handleAddAsset}>Add</AddAssetBtn>
          </AddAssetForm>
        </AddAssetWrapper>
      </MyAssetsPageContent>
    </>
  );
}
