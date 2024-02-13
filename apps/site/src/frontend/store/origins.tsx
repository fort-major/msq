import { IOriginDataExternal, TIdentityId, TOrigin, unreacheable } from "@fort-major/msq-shared";
import { IChildren, ONE_SEC_MS } from "../utils";
import { createStore, produce } from "solid-js/store";
import { createContext, createSignal, useContext } from "solid-js";
import { useMsqClient } from "./global";

export type AllOriginData = Record<TOrigin, IOriginDataExternal | undefined>;
export interface IOriginDataStore {
  originsData: AllOriginData;

  init: (origins?: TOrigin[]) => Promise<void>;
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
  const [initialized, setInitialized] = createSignal(false);
  const _msq = useMsqClient();

  const init = async (origins?: TOrigin[]) => {
    if (initialized()) return;

    await fetch(origins, true);

    setInitialized(true);
  };

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
        init,
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
