import { Accessor, Resource, createContext, createResource, createSignal, useContext } from "solid-js";
import { InternalSnapClient, MasqueradeClient, MasqueradeIdentity, TMsqCreateOk } from "@fort-major/masquerade-client";
import { IChildren, SHOULD_BE_FLASK, handleStatistics, makeAnonymousAgent } from "../utils";
import { unreacheable } from "@fort-major/masquerade-shared";
import { useNavigate } from "@solidjs/router";

interface IGlobalContext {
  snapClient: Resource<InternalSnapClient>;
  identity: Resource<MasqueradeIdentity>;
  showLoader: Accessor<boolean>;
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

export function useLoader(): Accessor<boolean> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.showLoader;
}

export function GlobalStore(props: IChildren) {
  const showLoader = createSignal(true);
  const navigate = useNavigate();

  const [snapClient] = createResource(async () => {
    const inner = await MasqueradeClient.create({
      snapId: import.meta.env.VITE_MSQ_SNAP_ID,
      snapVersion: import.meta.env.VITE_MSQ_SNAP_VERSION,
      shouldBeFlask: SHOULD_BE_FLASK,
      debug: import.meta.env.VITE_MSQ_MODE === "DEV",
      forceReinstall: import.meta.env.VITE_MSQ_MODE === "DEV",
    });

    let client = InternalSnapClient.create(undefined);
    if (inner.hasOwnProperty("InstallMetaMask")) {
      showLoader[1](false);
      navigate("/install-metamask");
    }

    if (inner.hasOwnProperty("UnblockMSQ")) {
      showLoader[1](false);
      navigate("/unblock-msq");
    }

    if (inner.hasOwnProperty("EnableMSQ")) {
      showLoader[1](false);
      navigate("/enable-msq");
    }

    if (inner.hasOwnProperty("Ok")) {
      client = InternalSnapClient.create((inner as TMsqCreateOk).Ok);

      const isAuthorized = await client.getInner().isAuthorized();
      if (!isAuthorized) await client.login(window.location.origin, 0, import.meta.env.VITE_MSQ_SNAP_SITE_ORIGIN);

      makeAnonymousAgent(import.meta.env.VITE_MSQ_DFX_NETWORK_HOST).then((agent) => handleStatistics(agent, client));
      showLoader[1](false);
    }

    return client;
  });

  const [identity] = createResource(snapClient, (client) => {
    return MasqueradeIdentity.create(client.getInner());
  });

  return (
    <GlobalContext.Provider value={{ snapClient, identity, showLoader: showLoader[0] }}>
      {props.children}
    </GlobalContext.Provider>
  );
}
