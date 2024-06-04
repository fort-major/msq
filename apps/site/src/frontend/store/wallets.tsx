import { Accessor, createContext, createSignal, useContext } from "solid-js";
import { TAccountId, unreacheable } from "@fort-major/msq-shared";
import {
  IWallet,
  Result,
  WalletError,
  connectBitfinityWallet,
  connectNNSWallet,
  connectPlugWallet,
  msqToIWallet,
} from "../utils/wallets";
import { IChildren, toastErr } from "../utils";
import { useConnectMsq, useMsqClient } from "./global";
import { useAssetData } from "./assets";
import { InternalSnapClient } from "@fort-major/msq-client";

export type TThirdPartyWalletKind = "MSQ" | "NNS" | "Plug" | "Bitfinity";
export type ConnectedWalletStore = [TThirdPartyWalletKind, IWallet | InternalSnapClient | undefined] | undefined;
type ConnectWalletFunc = (kind: TThirdPartyWalletKind) => Promise<void>;
type InitWalletFunc = (assetIds: string[]) => Promise<void>;
type SetWalletAccountFunc = (assetId: string, accountId: TAccountId) => Promise<void>;

interface IThirdPartyWalletsContext {
  connectWallet: ConnectWalletFunc;
  initWallet: InitWalletFunc;
  setWalletAccount: SetWalletAccountFunc;
  connectedWallet: Accessor<ConnectedWalletStore>;
}

const ThirdPartyWalletsContext = createContext<IThirdPartyWalletsContext>();

export function useThirdPartyWallet(): IThirdPartyWalletsContext {
  const ctx = useContext(ThirdPartyWalletsContext);

  if (!ctx) {
    unreacheable("Third party wallet context is uninitialized");
  }

  return ctx;
}

export function ThirdPartyWalletStore(props: IChildren) {
  const msq = useMsqClient();
  const connectMsq = useConnectMsq();
  const [connectedWallet, setConnectedWallet] = createSignal<ConnectedWalletStore>();
  const { init, initThirdPartyAccountInfo, refreshBalances } = useAssetData();

  const connectWallet: ConnectWalletFunc = async (kind) => {
    if (kind === "MSQ") {
      await connectMsq(false, false);
      setConnectedWallet([kind, undefined]);

      return;
    }

    let result: Result<IWallet, WalletError>;

    switch (kind) {
      case "Plug":
        result = await connectPlugWallet();
        break;

      case "Bitfinity":
        result = await connectBitfinityWallet();
        break;

      case "NNS":
        result = await connectNNSWallet();
        break;

      default:
        unreacheable("Invalid wallet kind");
    }

    if ("Err" in result) {
      toastErr(result.Err);
      return;
    }

    const wallet = result.Ok;

    setConnectedWallet([kind, wallet]);
  };

  const initWallet: InitWalletFunc = async (assetIds) => {
    const connected = connectedWallet();

    if (!connected) unreacheable("No wallet is connected for the initialization to take place");

    const [kind, wallet] = connected;

    if (kind === "MSQ") {
      init(assetIds);
    } else {
      const prin = await (wallet! as IWallet).getPrincipal();
      initThirdPartyAccountInfo(kind, prin.toText(), assetIds);
      refreshBalances(assetIds);
    }
  };

  const setWalletAccount: SetWalletAccountFunc = async (assetId, accountId) => {
    const connected = connectedWallet();

    if (!connected) unreacheable("No wallet is connected for the account setting to take place");

    const [kind, wallet] = connected;

    if (kind === "MSQ" && !wallet) {
      const _msq = msq();
      if (!_msq) unreacheable("MSQ wallet is not initialized");

      setConnectedWallet([kind, await msqToIWallet(_msq, assetId, accountId)]);
    }
  };

  return (
    <ThirdPartyWalletsContext.Provider value={{ connectWallet, connectedWallet, setWalletAccount, initWallet }}>
      {props.children}
    </ThirdPartyWalletsContext.Provider>
  );
}
