import { For, Match, Show, Switch, createEffect, createSignal, onCleanup } from "solid-js";
import { AllAssetData, useAllAssetData, useSendPageProps } from "../../../store/cabinet";
import { CabinetHeading } from "../../../ui-kit";
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
import {
  DEFAULT_PRINCIPAL,
  ONE_MIN_MS,
  assertEventSafe,
  getAssetMetadata,
  makeAgent,
  makeIcrc1Salt,
  tokensToStr,
} from "../../../utils";
import { Principal, TAccountId, delay } from "@fort-major/masquerade-shared";
import { useLoader, useMasqueradeClient } from "../../../store/global";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";
import { AnonymousIdentity } from "@dfinity/agent";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { PlusIcon } from "../../../components/typography/icons";
import { SetStoreFunction, produce } from "solid-js/store";
import { useNavigate } from "@solidjs/router";
import { ISendPageProps } from "./send";

export function MyAssetsPage() {
  const client = useMasqueradeClient();
  const [allAssetData, setAllAssetData, allAssetDataFetched, allAssetDataKeys] = useAllAssetData();
  const [newAssetId, setNewAssetId] = createSignal<string>("");
  const [error, setError] = createSignal<string | undefined>();

  const [sendPopupProps, setSendPopupProps] = useSendPageProps();

  const navigate = useNavigate();

  const [_, showLoader] = useLoader();
  createEffect(() => showLoader(!allAssetDataFetched()));

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

  const handleEdit = async (assetId: string, accountId: TAccountId, newName: string) => {
    await client()!.editAssetAccount(assetId, accountId, newName);

    setAllAssetData(assetId, "accounts", accountId, "name", newName);
  };

  const handleAddAccount = async (assetId: string, assetName: string, symbol: string) => {
    const name = await client()!.addAssetAccount(assetId, assetName, symbol);

    if (name === null) return;

    const accountId = allAssetData[assetId]!.accounts.length;

    setAllAssetData(assetId, "accounts", accountId, { name, balance: BigInt(0), principal: DEFAULT_PRINCIPAL });

    const identity = await MasqueradeIdentity.create(client()!.getInner(), makeIcrc1Salt(assetId, accountId));
    const principal = identity.getPrincipal();

    setAllAssetData(assetId, "accounts", accountId, "principal", principal.toText());

    const anonIdentity = new AnonymousIdentity();
    const agent = await makeAgent(anonIdentity);
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

    updateBalanceOf(ledger, allAssetData, setAllAssetData, assetId, accountId);
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
      const anonIdentity = new AnonymousIdentity();
      const agent = await makeAgent(anonIdentity);
      const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(sendPopupProps()!.assetId) });

      const accounts = allAssetData[sendPopupProps()!.assetId]!.accounts;

      for (let accountId = 0; accountId < accounts.length; accountId++) {
        await updateBalanceOf(ledger, allAssetData, setAllAssetData, sendPopupProps()!.assetId, accountId);
      }
    }

    setSendPopupProps(undefined);
  };

  return (
    <>
      <CabinetHeading>My Assets</CabinetHeading>
      <MyAssetsPageContent>
        <For each={allAssetDataKeys()}>
          {(assetId) => (
            <Spoiler
              defaultOpen={
                !!allAssetData[assetId] &&
                (allAssetData[assetId]!.totalBalance > 0n || allAssetData[assetId]!.accounts[0].name === "Creating...")
              }
              header={
                <AssetSpoilerHeader>
                  <Show when={allAssetData[assetId]?.metadata} fallback={<Title>{assetId}</Title>}>
                    <Title>{allAssetData[assetId]!.metadata!.name}</Title>
                  </Show>
                  <Show
                    when={allAssetData[assetId]?.metadata}
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
