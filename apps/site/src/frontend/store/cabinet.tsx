import {
  IOriginDataExternal,
  Principal,
  TAccountId,
  TOrigin,
  strToBytes,
  unreacheable,
} from "@fort-major/masquerade-shared";
import { Accessor, createContext, createEffect, createMemo, createSignal, useContext } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { IChildren, getAssetMetadata, makeAgent } from "../utils";
import { useMasqueradeClient } from "./global";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { AnonymousIdentity } from "@dfinity/agent";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";

type IAssetDataExt = {
  accounts: {
    name: string;
    principal?: string | undefined;
    balance: bigint;
  }[];
  metadata?:
    | {
        name: string;
        symbol: string;
        decimals: number;
        fee: bigint;
      }
    | undefined;
  totalBalance: bigint;
};

export type AllOriginData = Record<TOrigin, IOriginDataExternal | undefined>;
export type AllAssetData = Record<string, IAssetDataExt | null>;
export type AllOriginDataStore = [
  AllOriginData,
  SetStoreFunction<AllOriginData>,
  Accessor<boolean>,
  Accessor<TOrigin[]>,
];
export type AllAssetDataStore = [AllAssetData, SetStoreFunction<AllAssetData>, Accessor<boolean>, Accessor<string[]>];

interface ICabinetContext {
  allOriginData: AllOriginDataStore;
  allAssetData: AllAssetDataStore;
}

const CabinetContext = createContext<ICabinetContext>();

export function useAllOriginData(): AllOriginDataStore {
  const c = useContext(CabinetContext);

  if (!c) {
    unreacheable("Cabinet context is uninitialized");
  }

  return c.allOriginData;
}

export function useAllAssetData(): AllAssetDataStore {
  const c = useContext(CabinetContext);

  if (!c) {
    unreacheable("Cabinet context is uninitialized");
  }

  return c.allAssetData;
}

export function CabinetStore(props: IChildren) {
  const [allOriginDataFetched, setAllOriginDataFetched] = createSignal<boolean>(false);
  const [allOriginData, setAllOriginData] = createStore<AllOriginData>({});
  const allOriginDataKeys = createMemo(() => Object.keys(allOriginData));

  const [allAssetDataFetched, setAllAssetDataFetched] = createSignal<boolean>(false);
  const [allAssetData, setAllAssetData] = createStore<AllAssetData>({});
  const allAssetDataKeys = createMemo(() => Object.keys(allAssetData));

  const client = useMasqueradeClient();

  createEffect(async () => {
    if (client() !== undefined) {
      const fetchedAllOriginData = await client()!.getAllOriginData();

      setAllOriginData(fetchedAllOriginData);
      setAllOriginDataFetched(true);

      const fetchedAllAssetData = await client()!.getAllAssetData();
      const allAssetDataKeys = Object.keys(fetchedAllAssetData);

      const allAssetData = fetchedAllAssetData as unknown as AllAssetData;

      for (let key of allAssetDataKeys) {
        allAssetData[key]!.accounts = fetchedAllAssetData[key]!.accounts.map((it) => ({
          name: it,
          balance: BigInt(0),
        }));
        allAssetData[key]!.totalBalance = BigInt(0);
      }

      setAllAssetData(allAssetData);
      setAllAssetDataFetched(true);

      const agent = await makeAgent(new AnonymousIdentity());

      for (let assetId of allAssetDataKeys) {
        const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

        getAssetMetadata(ledger, assetId)
          .then((metadata) => {
            setAllAssetData(assetId, { metadata });

            let unresponsive = false;

            for (let idx = 0; idx < allAssetData[assetId]!.accounts.length; idx++) {
              MasqueradeIdentity.create(client()!.getInner(), makeIcrc1Salt(assetId, idx)).then((identity) => {
                const principal = identity.getPrincipal();

                ledger
                  .balance({ certified: true, owner: principal })
                  .then((balance) => {
                    if (unresponsive) return;

                    setAllAssetData(assetId, "accounts", idx, { principal: principal.toText(), balance });
                    setAllAssetData(assetId, "totalBalance", allAssetData[assetId]!.totalBalance + balance);
                  })
                  .catch(() => {
                    setAllAssetData(assetId, null);
                    unresponsive = true;
                  });
              });
            }
          })
          .catch(() => setAllAssetData(assetId, null));
      }
    }
  });

  return (
    <CabinetContext.Provider
      value={{
        allOriginData: [allOriginData, setAllOriginData, allOriginDataFetched, allOriginDataKeys],
        allAssetData: [allAssetData, setAllAssetData, allAssetDataFetched, allAssetDataKeys],
      }}
    >
      {props.children}
    </CabinetContext.Provider>
  );
}

export function makeIcrc1Salt(assetId: string, accountId: TAccountId): Uint8Array {
  return strToBytes(`\xacicrc1\n${assetId}\n${accountId}`);
}
