import { IMask, IOriginDataExternal, TIdentityId, TOrigin, delay, unreacheable } from "@fort-major/masquerade-shared";
import { IChildren, ONE_SEC_MS } from "../utils";
import { SetStoreFunction, createStore, produce } from "solid-js/store";
import { Accessor, createContext, createMemo, createSignal, onCleanup, onMount, useContext } from "solid-js";
import { useMasqueradeClient } from "./global";

export type AllOriginData = Record<TOrigin, IOriginDataExternal | undefined>;
export interface IOriginDataStore {
  originsData: AllOriginData;

  fetch: (origins?: TOrigin[], ignoreDiminishing?: boolean) => Promise<void>;
  addNewMask: (origin: TOrigin) => Promise<void>;
  editPseudonym: (origin: TOrigin, identityId: TIdentityId, newPseudonym: string) => Promise<void>;
  unlinkOne: (origin: TOrigin, withOrigin: TOrigin) => Promise<void>;
  unlinkAll: (origin: TOrigin) => Promise<void>;
  stopSession: (origin: TOrigin) => Promise<void>;
}

const OriginDataContext = createContext<IOriginDataStore>();

export function useOriginData() {
  const c = useContext(OriginDataContext);

  if (!c) {
    unreacheable("Asset context is uninitialized");
  }

  return c;
}

export function OriginDataStore(props: IChildren) {
  const [allOriginData, setAllOriginData] = createStore<AllOriginData>({});
  const [fetchedAt, setFetchedAt] = createSignal(0);
  const [refreshPeriodically, setRefreshPeriodically] = createSignal(true);
  const _msq = useMasqueradeClient();

  onMount(async () => {
    while (refreshPeriodically()) {
      await delay(ONE_SEC_MS * 7);

      if (_msq()) {
        const origins = Object.keys(allOriginData);
        await fetch(origins);
      }
    }
  });

  onCleanup(() => setRefreshPeriodically(false));

  const fetch = async (origins?: TOrigin[], ignoreDiminishing?: boolean) => {
    if (Date.now() - fetchedAt() < ONE_SEC_MS * 5 && !ignoreDiminishing) return;

    const msq = _msq()!;

    const fetchedAllOriginData = await msq.getAllOriginData(origins);

    // delete origin data of the msq site itself
    delete fetchedAllOriginData[import.meta.env.VITE_MSQ_SNAP_SITE_ORIGIN];

    setAllOriginData(fetchedAllOriginData);
    setFetchedAt(Date.now());
  };

  const addNewMask = async (origin: TOrigin) => {
    const msq = _msq()!;

    const newMask = await msq.register(origin);
    if (!newMask) return;

    setAllOriginData(
      produce((a) => {
        a[origin]!.masks.push(newMask);
      }),
    );
  };

  const editPseudonym = async (origin: TOrigin, identityId: TIdentityId, newPseudonym: string) => {
    const msq = _msq()!;

    setAllOriginData(origin, "masks", identityId, "pseudonym", newPseudonym);
    await msq.editPseudonym(origin, identityId, newPseudonym);
  };

  const unlinkOne = async (origin: TOrigin, withOrigin: TOrigin) => {
    const msq = _msq()!;
    const result = await msq.unlinkOne(origin, withOrigin);

    if (result) {
      setAllOriginData(
        produce((data) => {
          const from = data[origin]!;
          from.linksTo = from.linksTo.filter((link) => link !== withOrigin);

          const to = data[withOrigin]!;
          to.linksFrom = to.linksFrom.filter((link) => link !== origin);
        }),
      );
    }
  };

  const unlinkAll = async (origin: TOrigin) => {
    const msq = _msq()!;
    const result = await msq.unlinkAll(origin);

    if (result) {
      setAllOriginData(
        produce((data) => {
          const from = data[origin]!;
          const oldLinks = from.linksTo;
          from.linksTo = [];

          for (let withOrigin of oldLinks) {
            const to = data[withOrigin]!;
            to.linksFrom = to.linksFrom.filter((link) => link !== origin);
          }
        }),
      );
    }
  };

  const stopSession = async (origin: TOrigin) => {
    const msq = _msq()!;
    const result = await msq.stopSession(origin);

    if (result) {
      setAllOriginData(origin, "currentSession", undefined);
    }
  };

  return (
    <OriginDataContext.Provider
      value={{
        originsData: allOriginData,

        fetch,
        addNewMask,
        editPseudonym,
        unlinkOne,
        unlinkAll,
        stopSession,
      }}
    >
      {props.children}
    </OriginDataContext.Provider>
  );
}
