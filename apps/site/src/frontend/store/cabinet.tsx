import { IOriginDataExternal, Principal, TOrigin, unreacheable } from "@fort-major/masquerade-shared";
import { Accessor, Setter, createContext, createEffect, createMemo, createSignal, useContext } from "solid-js";
import { SetStoreFunction, createStore, produce } from "solid-js/store";
import { IChildren, getAssetMetadata, makeAgent, makeIcrc1Salt } from "../utils";
import { useIcAgent, useMasqueradeClient } from "./global";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { AnonymousIdentity } from "@dfinity/agent";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";
import { ISendPageProps } from "../pages/cabinet/my-assets/send";

export type IAssetDataExt = {
  accounts: {
    name: string;
    principal?: string | undefined;
    balance: bigint | undefined;
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

export type SendPagePropsStore = [Accessor<ISendPageProps | undefined>, Setter<ISendPageProps | undefined>];

interface ICabinetContext {
  allOriginData: AllOriginDataStore;
  allAssetData: AllAssetDataStore;
  sendPageProps: SendPagePropsStore;
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

export function useSendPageProps(): SendPagePropsStore {
  const c = useContext(CabinetContext);

  if (!c) {
    unreacheable("Cabinet context is uninitialized");
  }

  return c.sendPageProps;
}

export function CabinetStore(props: IChildren) {
  const [allOriginDataFetched, setAllOriginDataFetched] = createSignal<boolean>(false);
  const [allOriginData, setAllOriginData] = createStore<AllOriginData>({});
  const allOriginDataKeys = createMemo(() => Object.keys(allOriginData));

  const [allAssetDataFetched, setAllAssetDataFetched] = createSignal<boolean>(false);
  const [allAssetData, setAllAssetData] = createStore<AllAssetData>({});
  const allAssetDataKeys = createMemo(() => Object.keys(allAssetData));

  const [sendPageProps, setSendPageProps] = createSignal<ISendPageProps | undefined>(undefined);

  const icAgent = useIcAgent();
  const client = useMasqueradeClient();

  createEffect(async () => {
    if (!client() || !icAgent()) return;

    const fetchedAllOriginData = await client()!.getAllOriginData();

    // delete origin data of the msq site itself
    delete fetchedAllOriginData[window.location.origin];

    setAllOriginData(fetchedAllOriginData);
    setAllOriginDataFetched(true);

    const fetchedAllAssetData = await client()!.getAllAssetData();
    const allAssetDataKeys = Object.keys(fetchedAllAssetData);

    const allAssetData = fetchedAllAssetData as unknown as AllAssetData;

    for (let key of allAssetDataKeys) {
      allAssetData[key]!.accounts = fetchedAllAssetData[key]!.accounts.map((it) => ({
        name: it,
        balance: undefined,
      }));
      allAssetData[key]!.totalBalance = BigInt(0);
    }

    setAllAssetData(allAssetData);
    setAllAssetDataFetched(true);

    const agent = icAgent()!;

    for (let assetId of allAssetDataKeys) {
      const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

      getAssetMetadata(ledger, false)
        .then((metadata) => {
          setAllAssetData(assetId, { metadata, totalBalance: 0n });

          getAssetMetadata(ledger, true).then((metadata) => setAllAssetData(assetId, "metadata", metadata));

          let unresponsive = false;

          for (let idx = 0; idx < allAssetData[assetId]!.accounts.length; idx++) {
            MasqueradeIdentity.create(client()!.getInner(), makeIcrc1Salt(assetId, idx)).then((identity) => {
              const principal = identity.getPrincipal();

              setAllAssetData(assetId, "accounts", idx, "principal", principal.toText());

              // first we query to be fast
              ledger
                .balance({ certified: false, owner: principal })
                .then(async (balance) => {
                  if (unresponsive) return;

                  setAllAssetData(
                    produce((state) => {
                      state[assetId]!.accounts[idx].balance = balance;
                      state[assetId]!.totalBalance = state[assetId]!.totalBalance + balance;
                    }),
                  );

                  // then we update to be safe
                  balance = await ledger.balance({ certified: true, owner: principal });

                  setAllAssetData(
                    produce((state) => {
                      state[assetId]!.accounts[idx].balance = balance;
                      const totalBalance = state[assetId]!.accounts.reduce(
                        (prev, cur) => prev + (cur.balance || 0n),
                        0n,
                      );

                      state[assetId]!.totalBalance = totalBalance;
                    }),
                  );
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
  });

  return (
    <CabinetContext.Provider
      value={{
        allOriginData: [allOriginData, setAllOriginData, allOriginDataFetched, allOriginDataKeys],
        allAssetData: [allAssetData, setAllAssetData, allAssetDataFetched, allAssetDataKeys],
        sendPageProps: [sendPageProps, setSendPageProps],
      }}
    >
      {props.children}
    </CabinetContext.Provider>
  );
}
