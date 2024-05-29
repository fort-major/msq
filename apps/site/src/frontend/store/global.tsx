import { Accessor, createContext, createSignal, useContext } from "solid-js";
import { InternalSnapClient, MsqClient, MsqIdentity, TMsqCreateOk } from "@fort-major/msq-client";
import { IChildren, getIcHost, getIcHostOrDefault, handleStatistics, makeAnonymousAgent } from "../utils";
import { unreacheable } from "@fort-major/msq-shared";
import { useNavigate } from "@solidjs/router";
import { ROOT } from "../routes";
import { WalletError, connectMSQWallet } from "../utils/wallets";

interface IGlobalContext {
  msqClient: Accessor<InternalSnapClient | undefined>;
  msqIdentity: Accessor<MsqIdentity | undefined>;
  connectMsq: () => Promise<void>;
  loaderShown: Accessor<boolean>;
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

export function GlobalStore(props: IChildren) {
  const [loaderShown, showLoader] = createSignal(false);
  const [msqClient, setMsqClient] = createSignal<InternalSnapClient>();
  const [msqIdentity, setMsqIdentity] = createSignal<MsqIdentity>();
  const navigate = useNavigate();

  const connectMsq = async () => {
    showLoader(true);

    const msqClient = await connectMSQWallet();

    if ("Err" in msqClient) {
      if (msqClient.Err === WalletError.ConnectionRejected) {
        navigate(ROOT["/"].error["/"]["connection-rejected"].path);
      }

      if (msqClient.Err === WalletError.WalletNotInstalled) {
        navigate(ROOT["/"].error["/"]["install-metamask"].path);
      }

      if (msqClient.Err === WalletError.MSQIsBlocked) {
        navigate(ROOT["/"].error["/"]["unblock-msq"].path);
      }

      if (msqClient.Err === WalletError.MSQIsDisabled) {
        navigate(ROOT["/"].error["/"]["enable-msq"].path);
      }

      showLoader(false);
      return;
    }

    const client = msqClient.Ok;

    showLoader(false);

    makeAnonymousAgent(getIcHostOrDefault()).then((agent) => handleStatistics(agent, client));

    setMsqClient(client);
    setMsqIdentity(await MsqIdentity.create(client.getInner()));
  };

  return (
    <GlobalContext.Provider value={{ connectMsq, msqClient, msqIdentity, loaderShown }}>
      {props.children}
    </GlobalContext.Provider>
  );
}
