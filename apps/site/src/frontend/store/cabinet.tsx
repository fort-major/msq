import { IOriginData, TIdentityId, TOrigin, unreacheable } from "@fort-major/masquerade-shared";
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
import { IChildren } from "../utils";
import { useMasqueradeClient } from "./global";

export type AllOriginData = [TOrigin, IOriginData | undefined][];

interface ICabinetContext {
  allOriginData: [AllOriginData, SetStoreFunction<AllOriginData>];
  allOriginDataFetched: Accessor<boolean>;
}

const CabinetContext = createContext<ICabinetContext>();

export function useAllOriginData(): [[AllOriginData, SetStoreFunction<AllOriginData>], Accessor<boolean>] {
  const c = useContext(CabinetContext);

  if (!c) {
    unreacheable("Cabinet context is uninitialized");
  }

  return [c.allOriginData, c.allOriginDataFetched];
}

export function CabinetStore(props: IChildren) {
  const [allOriginDataFetched, setAllOriginDataFetched] = createSignal<boolean>(false);
  const [allOriginData, setAllOriginData] = createStore<AllOriginData>([]);

  const client = useMasqueradeClient();

  createEffect(async () => {
    if (client() !== undefined) {
      const d = await client()!.getAllOriginData();

      setAllOriginData(Object.entries(d));
      setAllOriginDataFetched(true);
    }
  });

  return (
    <CabinetContext.Provider value={{ allOriginData: [allOriginData, setAllOriginData], allOriginDataFetched }}>
      {props.children}
    </CabinetContext.Provider>
  );
}
