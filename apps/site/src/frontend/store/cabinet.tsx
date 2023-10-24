import { IOriginData, Principal, TAccountId, TOrigin, strToBytes, unreacheable } from "@fort-major/masquerade-shared";
import { Accessor, createContext, createEffect, createSignal, useContext } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { IAssetMetadata, IChildren, getAssetMetadata, makeAgent } from "../utils";
import { useMasqueradeClient } from "./global";
import { IcrcLedgerCanister, IcrcMetadataResponseEntries } from "@dfinity/ledger-icrc";
import { AnonymousIdentity, HttpAgent } from "@dfinity/agent";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";

type IAssetDataExt = {
  accounts: {
    name: string;
    principal: string;
    balance: bigint;
  }[];
  name: string;
  symbol: string;
  decimals: number;
  fee: bigint;
  totalBalance: bigint;
};

export type AllOriginData = [TOrigin, IOriginData | undefined][];
export type AllAssetData = [string, IAssetDataExt | null][];

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

      const assetDataExt: AllAssetData = await Promise.all(
        Object.entries(assetData).map(async ([assetId, data]) => {
          let unresponsive = false;

          const agent = await makeAgent(new AnonymousIdentity());
          const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

          const metadataPromise = getAssetMetadata(ledger, assetId).catch(() => {
            unresponsive = true;
          }) as Promise<IAssetMetadata>;

          const accountsPromises = data!.accounts.map(async (name, idx) => {
            const identity = await MasqueradeIdentity.create(client()!.getInner(), makeIcrc1Salt(assetId, idx));
            const principal = identity.getPrincipal();

            try {
              const balance = await ledger.balance({ certified: true, owner: principal });
              return { name, principal: principal.toText(), balance };
            } catch (e) {
              unresponsive = true;
              return { name, principal: principal.toText(), balance: BigInt(0) };
            }
          });

          const [metadata, accounts] = await Promise.all([metadataPromise, Promise.all(accountsPromises)]);

          if (unresponsive) {
            return [assetId, null];
          }

          let totalBalance = accounts.reduce((prev, cur) => prev + cur.balance, BigInt(0));

          return [
            assetId,
            {
              accounts,
              ...metadata,
              totalBalance,
            },
          ];
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
