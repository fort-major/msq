import {
  Accessor,
  Resource,
  Setter,
  Show,
  children,
  createContext,
  createResource,
  createSignal,
  useContext,
} from "solid-js";
import { InternalSnapClient, MasqueradeIdentity } from "@fort-major/masquerade-client";
import { IChildren } from "../utils";
import { unreacheable } from "@fort-major/masquerade-shared";
import { Loader } from "../components/loader";

interface IGlobalContext {
  snapClient: Resource<InternalSnapClient>;
  identity: Resource<MasqueradeIdentity>;
  showLoader: [Accessor<boolean>, Setter<boolean>];
}

const GlobalContext = createContext<IGlobalContext>();

export function useMasqueradeClient(): Accessor<InternalSnapClient | undefined> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.snapClient;
}

export function useIdentity(): Accessor<MasqueradeIdentity | undefined> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.identity;
}

export function useLoader(): [Accessor<boolean>, Setter<boolean>] {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.showLoader;
}

export function GlobalStore(props: IChildren) {
  const showLoader = createSignal(false);

  const [snapClient] = createResource(() =>
    InternalSnapClient.create({
      snapId: import.meta.env.VITE_MSQ_SNAP_ID,
      snapVersion: import.meta.env.VITE_MSQ_SNAP_VERSION,
      debug: import.meta.env.VITE_MSQ_MODE === "DEV",
      forceReinstall: import.meta.env.VITE_MSQ_MODE === "DEV",
    }),
  );

  const [identity] = createResource(snapClient, async (client) => {
    const isAuthorized = await client.getInner().isAuthorized();

    if (!isAuthorized) await client.login(window.location.origin, 0, import.meta.env.VITE_MSQ_SNAP_SITE_ORIGIN);

    return MasqueradeIdentity.create(client.getInner());
  });

  return <GlobalContext.Provider value={{ snapClient, identity, showLoader }}>{props.children}</GlobalContext.Provider>;
}
