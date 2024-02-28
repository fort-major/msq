import { createStore, produce } from "solid-js/store";
import { useMsqClient } from "./global";
import { Accessor, Setter, createContext, createEffect, createSignal, onCleanup, onMount, useContext } from "solid-js";
import {
  DEFAULT_PRINCIPAL,
  IAssetMetadata,
  IChildren,
  ONE_MIN_MS,
  getAssetMetadata,
  makeAgent,
  makeAnonymousAgent,
  makeIcrc1Salt,
} from "../utils";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";
import { MsqIdentity } from "@fort-major/msq-client";
import { PRE_LISTED_TOKENS, TAccountId, delay, unreacheable } from "@fort-major/msq-shared";
import { AnonymousIdentity } from "@dfinity/agent";
import { ISendPageProps } from "../pages/cabinet/my-assets/send";
import { IPaymentCheckoutPageProps } from "../pages/integration/payment/checkout";
import { ITxnHistoryPageProps } from "../pages/cabinet/my-assets/txn-history";

export type IAssetDataExt = {
  accounts: {
    name: string;
    principal?: string | undefined;
    balance: bigint | undefined;
  }[];
  metadata?: IAssetMetadata | undefined;
  totalBalance: bigint;
};
// undefined == not loaded yet, null == erroed
export type AllAssetData = Record<string, IAssetDataExt | undefined | null>;
export type SendPagePropsStore = [Accessor<ISendPageProps | undefined>, Setter<ISendPageProps | undefined>];
export type TxnHistoryPropsStore = [
  Accessor<ITxnHistoryPageProps | undefined>,
  Setter<ITxnHistoryPageProps | undefined>,
];
type PaymentCheckoutPageStore = [
  Accessor<IPaymentCheckoutPageProps | undefined>,
  Setter<IPaymentCheckoutPageProps | undefined>,
];

export interface IAssetDataStore {
  assets: AllAssetData;
  init: (assetIds?: string[]) => Promise<void>;
  fetch: (assetIds?: string[]) => Promise<boolean[] | undefined>;
  refresh: (assetIds?: string[]) => Promise<void>;
  addAccount: (assetId: string, assetName: string, symbol: string) => Promise<void>;
  editAccount: (assetId: string, accountId: TAccountId, newName: string) => Promise<void>;
  addAsset: (assetId: string) => Promise<void>;
  removeAssetLogo: (assetId: string) => void;
  sendPageProps: SendPagePropsStore;
  paymentCheckoutPageProps: PaymentCheckoutPageStore;
  txnHistoryPageProps: TxnHistoryPropsStore;
}

const AssetDataContext = createContext<IAssetDataStore>();

export function useAssetData(): IAssetDataStore {
  const c = useContext(AssetDataContext);

  if (!c) {
    unreacheable("Asset context is uninitialized");
  }

  return c;
}

export function useSendPageProps(): SendPagePropsStore {
  const c = useContext(AssetDataContext);

  if (!c) {
    unreacheable("Cabinet context is uninitialized");
  }

  return c.sendPageProps;
}

export function usePaymentCheckoutPageProps() {
  const ctx = useContext(AssetDataContext);

  if (!ctx) {
    unreacheable("Integration context is uninitialized");
  }

  return ctx.paymentCheckoutPageProps;
}

export function useTxnHistoryPageProps() {
  const ctx = useContext(AssetDataContext);

  if (!ctx) {
    unreacheable("Integration context is uninitialized");
  }

  return ctx.txnHistoryPageProps;
}

const PRE_DEFINED_ASSETS = Object.values(PRE_LISTED_TOKENS).map((it) => it.assetId);

export function AssetsStore(props: IChildren) {
  const [allAssetData, setAllAssetData] = createStore<AllAssetData>();
  const [sendPageProps, setSendPageProps] = createSignal<ISendPageProps | undefined>(undefined);
  const [paymentCheckoutPageProps, setPaymentCheckoutPageProps] = createSignal<IPaymentCheckoutPageProps | undefined>();
  const [txnHistoryPageProps, setTxnHistoryPageProps] = createSignal<ITxnHistoryPageProps | undefined>();
  const [refreshPeriodically, setRefreshPeriodically] = createSignal(true);
  const [initialized, setInitialized] = createSignal(false);
  const _msq = useMsqClient();

  onMount(async () => {
    while (refreshPeriodically()) {
      await delay(ONE_MIN_MS);

      if (_msq()) await refresh();
    }
  });

  onCleanup(() => {
    setRefreshPeriodically(false);
  });

  const init = async () => {
    if (initialized()) return;

    await fetch();
    await refresh();
    setInitialized(true);
  };

  const fetch = async (assetIds?: string[]): Promise<boolean[] | undefined> => {
    const msq = _msq()!;

    let fetchedAllAssetData = await msq.getAllAssetData(assetIds);

    // CREATE PRE-DEFINED ASSETS
    const assetsToCreate = [];
    for (let assetId of PRE_DEFINED_ASSETS) {
      if (fetchedAllAssetData[assetId]) continue;
      assetsToCreate.push({ assetId });
    }
    if (assetsToCreate.length > 0) {
      await msq.addAsset({ assets: assetsToCreate });
      fetchedAllAssetData = await msq.getAllAssetData(assetIds);
    }

    const allAssetDataKeys = Object.keys(fetchedAllAssetData);

    const allAssetData = fetchedAllAssetData as unknown as AllAssetData;

    const result: boolean[] | undefined = assetIds?.map((_) => false);

    for (let idx = 0; idx < allAssetDataKeys.length; idx++) {
      const key = allAssetDataKeys[idx];

      if (result && assetIds!.includes(key)) result[idx] = true;

      allAssetData[key]!.accounts = fetchedAllAssetData[key]!.accounts.map((it) => ({
        name: it,
        balance: undefined,
      }));
      allAssetData[key]!.totalBalance = BigInt(0);
    }

    setAllAssetData(allAssetData);

    return result;
  };

  const refresh = async (assetIds?: string[]) => {
    const msq = _msq()!;
    const agent = await makeAnonymousAgent();

    if (!assetIds) assetIds = Object.keys(allAssetData);

    for (let assetId of assetIds) {
      const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

      getAssetMetadata(ledger, false)
        .then((metadata) => {
          // if we're queried for the first time, or the data is different - send an update to verify
          if (!metadataIsEqual(metadata, allAssetData[assetId]?.metadata)) {
            setAllAssetData(assetId, { metadata, totalBalance: 0n });
            getAssetMetadata(ledger, true).then((metadata) => setAllAssetData(assetId, "metadata", metadata));
          }

          for (let idx = 0; idx < allAssetData[assetId]!.accounts.length; idx++) {
            MsqIdentity.create(msq.getInner(), makeIcrc1Salt(assetId, idx)).then((identity) => {
              const principal = identity.getPrincipal();

              setAllAssetData(assetId, "accounts", idx, "principal", principal.toText());

              updateBalanceOf(ledger, assetId, idx);
            });
          }
        })
        .catch((e) => {
          console.error(e);
          setAllAssetData(assetId, null);
        });
    }
  };

  const addAccount = async (assetId: string, assetName: string, symbol: string) => {
    const msq = _msq()!;
    const name = await msq.addAssetAccount(assetId, assetName, symbol);

    if (name === null) return;

    const accountId = allAssetData[assetId]!.accounts.length;

    setAllAssetData(assetId, "accounts", accountId, { name, balance: BigInt(0), principal: DEFAULT_PRINCIPAL });

    const identity = await MsqIdentity.create(msq.getInner(), makeIcrc1Salt(assetId, accountId));
    const principal = identity.getPrincipal();

    setAllAssetData(assetId, "accounts", accountId, "principal", principal.toText());

    const agent = await makeAnonymousAgent();
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

    try {
      await updateBalanceOf(ledger, assetId, accountId);
    } catch {
      setAllAssetData(assetId, null);
    }
  };

  const addAsset = async (assetId: string) => {
    const msq = _msq()!;

    const anonIdentity = new AnonymousIdentity();
    const agent = await makeAgent(anonIdentity);
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

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
    const assetData = await msq.addAsset({ assets: [{ assetId, name: metadata.name, symbol: metadata.symbol }] });

    if (assetData === null) {
      setAllAssetData(assetId, undefined);
      return;
    }

    setAllAssetData(
      produce((state) => {
        state[assetId]!.metadata = metadata;
        state[assetId]!.accounts[0].name = assetData[0].accounts[0];
      }),
    );

    const identity = await MsqIdentity.create(msq.getInner(), makeIcrc1Salt(assetId, 0));
    const principal = identity.getPrincipal();

    setAllAssetData(assetId, "accounts", 0, "principal", principal.toText());

    updateBalanceOf(ledger, assetId, 0);
  };

  const editAccount = async (assetId: string, accountId: TAccountId, newName: string) => {
    const msq = _msq()!;

    setAllAssetData(assetId, "accounts", accountId, "name", newName);
    await msq.editAssetAccount(assetId, accountId, newName);
  };

  const updateBalanceOf = async (ledger: IcrcLedgerCanister, assetId: string, accountId: number) => {
    // first we query to be fast
    let balance = await ledger.balance({
      certified: false,
      owner: Principal.fromText(allAssetData[assetId]!.accounts[accountId].principal!),
    });

    // if balance is the same as we were observing the last time - skip the update call
    if (balance === allAssetData[assetId]?.accounts[accountId].balance) return;

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
  };

  const removeAssetLogo = (assetId: string) => {
    setAllAssetData(assetId, "metadata", "logoSrc", undefined);
  };

  return (
    <AssetDataContext.Provider
      value={{
        assets: allAssetData,
        init,
        fetch,
        refresh,
        addAccount,
        editAccount,
        addAsset,
        removeAssetLogo,
        sendPageProps: [sendPageProps, setSendPageProps],
        paymentCheckoutPageProps: [paymentCheckoutPageProps, setPaymentCheckoutPageProps],
        txnHistoryPageProps: [txnHistoryPageProps, setTxnHistoryPageProps],
      }}
    >
      {props.children}
    </AssetDataContext.Provider>
  );
}

function metadataIsEqual(a: IAssetMetadata, b?: IAssetMetadata): boolean {
  if (!b) return false;

  if (a.decimals !== b.decimals) return false;
  if (a.fee !== b.fee) return false;
  if (a.symbol !== b.symbol) return false;
  if (a.name !== b.name) return false;

  return true;
}
