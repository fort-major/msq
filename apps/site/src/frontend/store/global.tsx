import { Accessor, createContext, createSignal, onCleanup, onMount, useContext } from "solid-js";
import { toast } from "solid-toast";
import { InternalSnapClient, MsqIdentity } from "@fort-major/msq-client";
import { IChildren, getIcHostOrDefault, handleStatistics, makeAnonymousAgent, toastErr } from "../utils";
import { unreacheable } from "@fort-major/msq-shared";
import { useNavigate } from "@solidjs/router";
import { ROOT } from "../routes";
import { WalletError, connectMSQWallet } from "../utils/wallets";

type ConnectMsqFunc = (withLoader: boolean, withErrorPages: boolean) => Promise<boolean>;

interface IGlobalContext {
  msqClient: Accessor<InternalSnapClient | undefined>;
  msqIdentity: Accessor<MsqIdentity | undefined>;
  connectMsq: ConnectMsqFunc;
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

export function useConnectMsq() {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.connectMsq;
}

export function useLoader(): Accessor<boolean> {
  const ctx = useContext(GlobalContext);

  if (!ctx) {
    unreacheable("Global context is uninitialized");
  }

  return ctx.loaderShown;
}

export function GlobalStore(props: IChildren) {
  const navigate = useNavigate();

  const [loaderShown, showLoader] = createSignal(false);
  const [msqClient, setMsqClient] = createSignal<InternalSnapClient>();
  const [msqIdentity, setMsqIdentity] = createSignal<MsqIdentity>();

  const connectMsq: ConnectMsqFunc = async (withLoader, withErrorPages) => {
    if (withLoader) showLoader(true);

    const msqClient = await connectMSQWallet();

    if ("Err" in msqClient) {
      if (msqClient.Err === WalletError.ConnectionRejected) {
        if (withErrorPages) {
          navigate(ROOT["/"].error["/"]["connection-rejected"].path);
        } else {
          toastErr("Connection rejected");
        }
      }

      if (msqClient.Err === WalletError.WalletNotInstalled) {
        if (withErrorPages) {
          navigate(ROOT["/"].error["/"]["install-metamask"].path);
        } else {
          toastErr("MetaMask is not installed");
        }
      }

      if (msqClient.Err === WalletError.MSQIsBlocked) {
        if (withErrorPages) {
          navigate(ROOT["/"].error["/"]["unblock-msq"].path);
        } else {
          toastErr("MSQ is in the blacklist");
        }
      }

      if (msqClient.Err === WalletError.MSQIsDisabled) {
        if (withErrorPages) {
          navigate(ROOT["/"].error["/"]["enable-msq"].path);
        } else {
          toastErr("Enable MSQ in Snaps settings of your MetaMask");
        }
      }

      if (withLoader) showLoader(false);
      return false;
    }

    const client = msqClient.Ok;

    if (withLoader) showLoader(false);

    makeAnonymousAgent(getIcHostOrDefault()).then((agent) => handleStatistics(agent, client));

    setMsqClient(client);
    setMsqIdentity(await MsqIdentity.create(client.getInner()));

    return true;
  };

  return (
    <GlobalContext.Provider value={{ connectMsq, msqClient, msqIdentity, loaderShown }}>
      {props.children}
    </GlobalContext.Provider>
  );
}
