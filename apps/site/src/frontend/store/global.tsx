import { Accessor, Resource, Setter, createContext, createResource, createSignal, useContext } from "solid-js";
import { ICRC35AsyncRequest, InternalSnapClient, MsqClient, MsqIdentity, TMsqCreateOk } from "@fort-major/msq-client";
import { IChildren, SHOULD_BE_FLASK, handleStatistics, makeAnonymousAgent } from "../utils";
import { IICRC1TransferRequest, unreacheable } from "@fort-major/msq-shared";
import { useNavigate } from "@solidjs/router";
import { ROOT, useMsqRoute } from "../routes";

export type ICRC35Store<T extends undefined | IICRC1TransferRequest = undefined | IICRC1TransferRequest> = [
  Accessor<ICRC35AsyncRequest<T> | undefined>,
  Setter<ICRC35AsyncRequest<T> | undefined>,
];

interface IGlobalContext {
  msqClient: Resource<InternalSnapClient | undefined | null>;
  identity: Resource<MsqIdentity>;
  showLoader: Accessor<boolean>;
  icrc35: ICRC35Store;
}

const GlobalContext = createContext<IGlobalContext>();

/**
 * Returns MSQ client after the initialization. Returns `undefined` if not yet initialized.
 * Returns `null` if `thirdPartyWallets` feature set true for this route
 *
 * @returns {InternalSnapClient | undefined | null}
 */
export function useMsqClient(): Accessor<InternalSnapClient | undefined | null> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.msqClient;
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
  const msqRoute = useMsqRoute();

  const [msqClient] = createResource(async () => {
    if (msqRoute.features?.thirdPartyWallets) return null;

    const innerMsqClient = await MsqClient.create({
      snapId: import.meta.env.VITE_MSQ_SNAP_ID,
      snapVersion: import.meta.env.VITE_MSQ_SNAP_VERSION,
      shouldBeFlask: SHOULD_BE_FLASK,
      debug: import.meta.env.VITE_MSQ_MODE === "DEV",
      forceReinstall: import.meta.env.VITE_MSQ_MODE === "DEV",
    });

    if ("MSQConnectionRejected" in innerMsqClient) {
      showLoader[1](false);
      navigate(ROOT["/"].error["/"]["connection-rejected"].path);

      return undefined;
    }

    if ("InstallMetaMask" in innerMsqClient) {
      showLoader[1](false);
      navigate(ROOT["/"].error["/"]["install-metamask"].path);

      return undefined;
    }

    if ("UnblockMSQ" in innerMsqClient) {
      showLoader[1](false);
      navigate(ROOT["/"].error["/"]["unblock-msq"].path);

      return undefined;
    }

    if ("EnableMSQ" in innerMsqClient) {
      showLoader[1](false);
      navigate(ROOT["/"].error["/"]["enable-msq"].path);

      return undefined;
    }

    if ("Ok" in innerMsqClient) {
      let client = InternalSnapClient.create((innerMsqClient as TMsqCreateOk).Ok);

      const isAuthorized = await client.getInner().isAuthorized();
      if (!isAuthorized) await client.login(window.location.origin, 0, import.meta.env.VITE_MSQ_SNAP_SITE_ORIGIN);

      makeAnonymousAgent(import.meta.env.VITE_MSQ_DFX_NETWORK_HOST).then((agent) => handleStatistics(agent, client));
      showLoader[1](false);

      return client;
    }

    console.error("Unreacheable during client initialization");
    return undefined;
  });

  const [identity] = createResource(msqClient, (client) => {
    return MsqIdentity.create(client.getInner());
  });

  return (
    <GlobalContext.Provider value={{ msqClient, identity, showLoader: showLoader[0], icrc35 }}>
      {props.children}
    </GlobalContext.Provider>
  );
}
