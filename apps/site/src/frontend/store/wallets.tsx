import { Accessor, createContext, createSignal, useContext } from "solid-js";
import { unreacheable } from "@fort-major/msq-shared";
import {
  IWallet,
  Result,
  WalletError,
  connectBitfinityWallet,
  connectNNSWallet,
  connectPlugWallet,
} from "../utils/wallets";
import { IChildren } from "../utils";

export type TThirdPartyWalletKind = "nns" | "plug" | "bitfinity";
export type ConnectedWalletsStore = Accessor<Partial<Record<TThirdPartyWalletKind, IWallet>>>;

interface IThirdPartyWalletsContext {
  connectWallet(kind: TThirdPartyWalletKind): Promise<void>;
  connectedWallets: ConnectedWalletsStore;
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
  const [connectedWallets, setConnectedWallets] = createSignal<Partial<Record<TThirdPartyWalletKind, IWallet>>>({});

  const connectWallet = async (kind: TThirdPartyWalletKind) => {
    let result: Result<IWallet, WalletError>;

    switch (kind) {
      case "plug":
        result = await connectPlugWallet();
        break;

      case "bitfinity":
        result = await connectBitfinityWallet();
        break;

      case "nns":
        result = await connectNNSWallet();
        break;
    }

    if ("Err" in result) {
      // TODO: also show a toast
      console.error(result.Err);
      return;
    }

    const wallet = result.Ok;

    setConnectedWallets({ ...connectedWallets(), [kind]: wallet });
  };

  return (
    <ThirdPartyWalletsContext.Provider value={{ connectWallet, connectedWallets }}>
      {props.children}
    </ThirdPartyWalletsContext.Provider>
  );
}
