import { Accessor, Setter, createContext, createSignal, useContext } from "solid-js";
import { ICRC35AsyncRequest, InternalSnapClient, MsqClient, MsqIdentity, TMsqCreateOk } from "@fort-major/msq-client";
import { IChildren, SHOULD_BE_FLASK, handleStatistics, makeAnonymousAgent } from "../utils";
import { IICRC1TransferRequest, unreacheable } from "@fort-major/msq-shared";
import { useNavigate } from "@solidjs/router";
import { ROOT } from "../routes";

export type ICRC35Store<T extends undefined | IICRC1TransferRequest = undefined | IICRC1TransferRequest> = [
  Accessor<ICRC35AsyncRequest<T> | undefined>,
  Setter<ICRC35AsyncRequest<T> | undefined>,
];

interface IGlobalContext {
  msqClient: Accessor<InternalSnapClient | undefined>;
  msqIdentity: Accessor<MsqIdentity | undefined>;
  connectMsq: () => Promise<void>;
  loaderShown: Accessor<boolean>;
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

export function useMsqIdentity(): Accessor<MsqIdentity | undefined> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.msqIdentity;
}

export function connectMsq(): Promise<void> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.connectMsq();
}

export function useLoader(): Accessor<boolean> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.loaderShown;
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
  const [loaderShown, showLoader] = createSignal(false);
  const [msqClient, setMsqClient] = createSignal<InternalSnapClient>();
  const [msqIdentity, setMsqIdentity] = createSignal<MsqIdentity>();
  const navigate = useNavigate();

  const connectMsq = async () => {
    showLoader(true);

    const innerMsqClient = await MsqClient.create({
      snapId: import.meta.env.VITE_MSQ_SNAP_ID,
      snapVersion: import.meta.env.VITE_MSQ_SNAP_VERSION,
      shouldBeFlask: SHOULD_BE_FLASK,
      debug: import.meta.env.VITE_MSQ_MODE === "DEV",
      forceReinstall: import.meta.env.VITE_MSQ_MODE === "DEV",
    });

    if ("MSQConnectionRejected" in innerMsqClient) {
      navigate(ROOT["/"].error["/"]["connection-rejected"].path);

      showLoader(false);

      return;
    }

    if ("InstallMetaMask" in innerMsqClient) {
      navigate(ROOT["/"].error["/"]["install-metamask"].path);

      showLoader(false);

      return;
    }

    if ("UnblockMSQ" in innerMsqClient) {
      navigate(ROOT["/"].error["/"]["unblock-msq"].path);

      showLoader(false);

      return;
    }

    if ("EnableMSQ" in innerMsqClient) {
      navigate(ROOT["/"].error["/"]["enable-msq"].path);

      showLoader(false);

      return;
    }

    if ("Ok" in innerMsqClient) {
      let client = InternalSnapClient.create((innerMsqClient as TMsqCreateOk).Ok);

      const isAuthorized = await client.getInner().isAuthorized();
      if (!isAuthorized) await client.login(window.location.origin, 0, import.meta.env.VITE_MSQ_SNAP_SITE_ORIGIN);

      showLoader(false);

      makeAnonymousAgent(import.meta.env.VITE_MSQ_DFX_NETWORK_HOST).then((agent) => handleStatistics(agent, client));

      setMsqClient(client);
      setMsqIdentity(await MsqIdentity.create(client.getInner()));

      return;
    }

    console.error("Unreacheable during client initialization");
  };

  return (
    <GlobalContext.Provider value={{ connectMsq, msqClient, msqIdentity, loaderShown, icrc35 }}>
      {props.children}
    </GlobalContext.Provider>
  );
}
