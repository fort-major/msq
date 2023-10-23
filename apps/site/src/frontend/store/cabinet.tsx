import {
  IAssetData,
  IOriginData,
  Principal,
  TAccountId,
  TIdentityId,
  TOrigin,
  strToBytes,
  unreacheable,
} from "@fort-major/masquerade-shared";
import {
  Accessor,
  children,
  createContext,
  createEffect,
  createResource,
  createSignal,
  on,
  onMount,
  useContext,
} from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { IChildren, makeAgent } from "../utils";
import { useMasqueradeClient } from "./global";
import { IcrcLedgerCanister, IcrcMetadataResponseEntries } from "@dfinity/ledger-icrc";
import { AnonymousIdentity } from "@dfinity/agent";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";

type IAssetDataExt = {
  accounts: {
    name: string;
    principal: string;
    balance: bigint;
  }[];
  name: string;
  symbol: string;
  decimals: bigint;
  fee: bigint;
};

export type AllOriginData = [TOrigin, IOriginData | undefined][];
export type AllAssetData = [string, IAssetDataExt | undefined][];

interface ICabinetContext {
  allOriginData: [AllOriginData, SetStoreFunction<AllOriginData>];
  allOriginDataFetched: Accessor<boolean>;
  allAssetData: [AllAssetData, SetStoreFunction<AllAssetData>];
  allAssetDataFetched: Accessor<boolean>;
}

const CabinetContext = createContext<ICabinetContext>();

export function useAllOriginData(): [[AllOriginData, SetStoreFunction<AllOriginData>], Accessor<boolean>] {
  const c = useContext(CabinetContext);

  if (!c) {
    unreacheable("Cabinet context is uninitialized");
  }

  return [c.allOriginData, c.allOriginDataFetched];
}

export function useAllAssetData(): [[AllAssetData, SetStoreFunction<AllAssetData>], Accessor<boolean>] {
  const c = useContext(CabinetContext);

  if (!c) {
    unreacheable("Cabinet context is uninitialized");
  }

  return [c.allAssetData, c.allAssetDataFetched];
}

export function CabinetStore(props: IChildren) {
  const [allOriginDataFetched, setAllOriginDataFetched] = createSignal<boolean>(false);
  const [allOriginData, setAllOriginData] = createStore<AllOriginData>([]);

  const [allAssetDataFetched, setAllAssetDataFetched] = createSignal<boolean>(false);
  const [allAssetData, setAllAssetData] = createStore<AllAssetData>([]);

  const client = useMasqueradeClient();

  createEffect(async () => {
    if (client() !== undefined) {
      const d = await client()!.getAllOriginData();

      setAllOriginData(Object.entries(d));
      setAllOriginDataFetched(true);

      const assetData = await client()!.getAllAssetData();
      const anonAgent = await makeAgent(new AnonymousIdentity());

      const assetDataExt: AllAssetData = await Promise.all(
        Object.entries(assetData).map(async ([assetId, data]) => {
          const ledger = IcrcLedgerCanister.create({ agent: anonAgent, canisterId: Principal.from(assetId) });
          const metadataPromise = ledger.metadata({ certified: true }) as Promise<unknown> as Promise<{
            [x: string]: unknown;
          }>;
          const accountsPromises = data!.accounts.map(async (accountName, idx) => {
            const identity = await MasqueradeIdentity.create(client()!.getInner(), makeIcrc1Salt(assetId, idx));
            const principal = identity.getPrincipal();

            const balance = await ledger.balance({ certified: true, owner: principal });

            return { name: accountName, principal: principal.toText(), balance };
          });

          const [metadata, accounts] = await Promise.all([metadataPromise, Promise.all(accountsPromises)]);

          const name = (metadata[IcrcMetadataResponseEntries.NAME] as { Text: string }).Text;
          const symbol = (metadata[IcrcMetadataResponseEntries.SYMBOL] as { Text: string }).Text;
          const fee = (metadata[IcrcMetadataResponseEntries.FEE] as { Nat: bigint }).Nat;
          const decimals = (metadata[IcrcMetadataResponseEntries.DECIMALS] as { Nat: bigint }).Nat;

          return [assetId, { accounts, name, symbol, fee, decimals }];
        }),
      );

      setAllAssetData(assetDataExt);
      setAllAssetDataFetched(true);
    }
  });

  return (
    <CabinetContext.Provider
      value={{
        allOriginData: [allOriginData, setAllOriginData],
        allOriginDataFetched,
        allAssetData: [allAssetData, setAllAssetData],
        allAssetDataFetched,
      }}
    >
      {props.children}
    </CabinetContext.Provider>
  );
}

export function makeIcrc1Salt(assetId: string, accountId: TAccountId): Uint8Array {
  return strToBytes(`\xacicrc1\n${assetId}\n${accountId}`);
}
