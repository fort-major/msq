import { Accessor, Resource, children, createContext, createResource, useContext } from "solid-js";
import { InternalSnapClient, MasqueradeIdentity } from "@fort-major/masquerade-client";
import { IChildren } from "../utils";
import { unreacheable } from "@fort-major/masquerade-shared";

interface IGlobalContext {
  snapClient: Resource<InternalSnapClient>;
  identity: Resource<MasqueradeIdentity>;
}

const GlobalContext = createContext<IGlobalContext>();

export function useMasqueradeClient(): Accessor<InternalSnapClient | undefined> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx!.snapClient;
}

export function useIdentity(): Accessor<MasqueradeIdentity | undefined> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx?.identity;
}

export function GlobalStore(props: IChildren) {
  const [snapClient] = createResource(() =>
    InternalSnapClient.create({
      snapId: import.meta.env.VITE_MSQ_SNAP_ID,
      snapVersion: import.meta.env.VITE_MSQ_SNAP_VERSION,
      debug: true,
    }),
  );

  const [identity] = createResource(snapClient, (client) => MasqueradeIdentity.create(client.getInner()));

  return <GlobalContext.Provider value={{ snapClient, identity }}>{props.children}</GlobalContext.Provider>;
}
