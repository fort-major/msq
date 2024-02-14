import { Accessor, Resource, Setter, createContext, createResource, createSignal, useContext } from "solid-js";
import { ICRC35AsyncRequest, InternalSnapClient, MsqClient, MsqIdentity, TMsqCreateOk } from "@fort-major/msq-client";
import { IChildren, SHOULD_BE_FLASK, handleStatistics, makeAnonymousAgent } from "../utils";
import { IICRC1TransferRequest, unreacheable } from "@fort-major/msq-shared";
import { useNavigate } from "@solidjs/router";

export type ICRC35Store<T extends undefined | IICRC1TransferRequest = undefined | IICRC1TransferRequest> = [
  Accessor<ICRC35AsyncRequest<T> | undefined>,
  Setter<ICRC35AsyncRequest<T> | undefined>,
];

interface IGlobalContext {
  snapClient: Resource<InternalSnapClient | undefined>;
  identity: Resource<MsqIdentity>;
  showLoader: Accessor<boolean>;
  icrc35: ICRC35Store;
}

const GlobalContext = createContext<IGlobalContext>();

export function useMsqClient(): Accessor<InternalSnapClient | undefined> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.snapClient;
}

export function useIdentity(): Accessor<MsqIdentity | undefined> {
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

export function useICRC35<T extends undefined | IICRC1TransferRequest>(): ICRC35Store<T> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.icrc35 as ICRC35Store<T>;
}

export function GlobalStore(props: IChildren) {
  const icrc35: ICRC35Store = createSignal();
  const showLoader = createSignal(true);
  const navigate = useNavigate();

  const [snapClient] = createResource(async () => {
    const inner = await MsqClient.create({
      snapId: import.meta.env.VITE_MSQ_SNAP_ID,
      snapVersion: import.meta.env.VITE_MSQ_SNAP_VERSION,
      shouldBeFlask: SHOULD_BE_FLASK,
      debug: import.meta.env.VITE_MSQ_MODE === "DEV",
      forceReinstall: import.meta.env.VITE_MSQ_MODE === "DEV",
    });

    if ("MSQConnectionRejected" in inner) {
      showLoader[1](false);
      navigate("/connection-rejected");

      return undefined;
    }

    if ("MobileNotSupported" in inner) {
      showLoader[1](false);
      navigate("/mobile-not-supported");

      return undefined;
    }

    if ("InstallMetaMask" in inner) {
      showLoader[1](false);
      navigate("/install-metamask");

      return undefined;
    }

    if ("UnblockMSQ" in inner) {
      showLoader[1](false);
      navigate("/unblock-msq");

      return undefined;
    }

    if ("EnableMSQ" in inner) {
      showLoader[1](false);
      navigate("/enable-msq");

      return undefined;
    }

    if ("Ok" in inner) {
      let client = InternalSnapClient.create((inner as TMsqCreateOk).Ok);

      const isAuthorized = await client.getInner().isAuthorized();
      if (!isAuthorized) await client.login(window.location.origin, 0, import.meta.env.VITE_MSQ_SNAP_SITE_ORIGIN);

      makeAnonymousAgent(import.meta.env.VITE_MSQ_DFX_NETWORK_HOST).then((agent) => handleStatistics(agent, client));
      showLoader[1](false);

      return client;
    }

    console.error("Unreacheable during client initialization");
    return undefined;
  });

  const [identity] = createResource(snapClient, (client) => {
    return MsqIdentity.create(client.getInner());
  });

  return (
    <GlobalContext.Provider value={{ snapClient, identity, showLoader: showLoader[0], icrc35 }}>
      {props.children}
    </GlobalContext.Provider>
  );
}
