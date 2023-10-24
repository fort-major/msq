import { For, Show, createEffect, createSignal } from "solid-js";
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
import PlusSvg from "#assets/plus.svg";
import { AccountCard } from "../../../components/account-card";
import { assertEventSafe, getAssetMetadata, makeAgent, tokensToStr } from "../../../utils";
import { Principal, TAccountId } from "@fort-major/masquerade-shared";
import { useMasqueradeClient } from "../../../store/global";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";
import { AnonymousIdentity } from "@dfinity/agent";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";

export function MyAssetsPage() {
  const client = useMasqueradeClient();
  const [[allAssetData, setAllAssetData], allAssetDataFetched] = useAllAssetData();
  const [newAssetId, setNewAssetId] = createSignal<string>("");
  const [error, setError] = createSignal<string | undefined>();

  const handleEdit = async (assetId: string, accountId: TAccountId, newName: string) => {
    await client()!.editAssetAccount(assetId, accountId, newName);

    setAllAssetData(([id]) => id === assetId, 1, "accounts", accountId, "name", newName);
  };

  const handleAddAccount = async (assetId: string, assetName: string, symbol: string) => {
    const name = await client()!.addAssetAccount(assetId, assetName, symbol);

    if (name === null) return;

    const accountId = allAssetData.find((it) => it[0] === assetId)![1]!.accounts.length;

    const identity = await MasqueradeIdentity.create(client()!.getInner(), makeIcrc1Salt(assetId, accountId));
    const principal = identity.getPrincipal();

    const anonIdentity = new AnonymousIdentity();
    const agent = await makeAgent(anonIdentity);
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

    const balance = await ledger.balance({ certified: true, owner: principal });

    setAllAssetData(([id]) => id === assetId, 1, "accounts", accountId, {
      name,
      principal: principal.toText(),
      balance,
    });
  };

  const handleAddAsset = async (e: Event) => {
    assertEventSafe(e);

    const assetId = newAssetId();

    const existing = allAssetData.find(([id]) => id === assetId);
    if (existing !== undefined) {
      setError(`Token ${existing[1]!.name} (${assetId}) already exists`);
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

      const identity = await MasqueradeIdentity.create(msq.getInner(), makeIcrc1Salt(assetId, 0));
      const principal = identity.getPrincipal();
      const balance = await ledger.balance({ certified: true, owner: principal });

      setAllAssetData(allAssetData.length, [
        assetId,
        {
          ...metadata,
          accounts: assetData.accounts.map((it) => ({ name: it, principal: principal.toText(), balance })),
          totalBalance: balance,
        },
      ]);
    } catch (e) {
      console.error(e);
      setError(`Token ${assetId} is not a valid ICRC-1 token or unresponsive`);
    }
  };

  return (
    <>
      <CabinetHeading>My Assets</CabinetHeading>
      <MyAssetsPageContent>
        <For each={allAssetData}>
          {(entry) => (
            <Show when={entry[1] !== null} fallback={<p>Token canister {entry[0]} does not respond...</p>}>
              <Spoiler
                header={
                  <AssetSpoilerHeader>
                    <Title>{entry[1]!.name}</Title>
                    <Title>
                      {tokensToStr(entry[1]!.totalBalance, entry[1]!.decimals)} <Dim>{entry[1]!.symbol}</Dim>
                    </Title>
                  </AssetSpoilerHeader>
                }
              >
                <AssetSpoilerContent>
                  <AssetAccountsWrapper>
                    <For each={entry[1]!.accounts}>
                      {(account, idx) => (
                        <AccountCard
                          accountId={idx()}
                          name={account.name}
                          principal={account.principal}
                          balance={account.balance}
                          symbol={entry[1]!.symbol}
                          decimals={entry[1]!.decimals}
                          onSend={() => {}}
                          onReceive={() => {}}
                          onEdit={(newName) => handleEdit(entry[0], idx(), newName)}
                        />
                      )}
                    </For>
                  </AssetAccountsWrapper>
                  <AssetAddAccountBtn onClick={() => handleAddAccount(entry[0], entry[1]!.name, entry[1]!.symbol)}>
                    <AssetAddAccountBtnIconWrapper>
                      <img src={PlusSvg} alt="add" />
                    </AssetAddAccountBtnIconWrapper>
                    <AssetAddAccountBtnText>Add New {entry[1]!.symbol} Account</AssetAddAccountBtnText>
                  </AssetAddAccountBtn>
                </AssetSpoilerContent>
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
