import { InternalSnapClient, MsqClient, MsqIdentity, TMsqCreateOk } from "@fort-major/msq-client";
import { PRE_LISTED_TOKENS, Principal, unreacheable } from "@fort-major/msq-shared";
import { getIcHostOrDefault, makeAgent } from ".";
import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { AccountIdentifier } from "@dfinity/ledger-icp";

export type Result<T, E> = { Ok: T } | { Err: E };
export enum WalletError {
  ConnectionRejected = "connection-rejected",
  WalletNotInstalled = "wallet-not-installed",
  MSQIsBlocked = "msq-is-blocked",
  MSQIsDisabled = "msq-is-disabled",
}

export type CreateActorArgs = {
  canisterId: string;
  interfaceFactory: (idl: { IDL: any }) => any;
};

export interface IWallet {
  getPrincipal: () => Promise<Principal>;
  getAccountId: () => Promise<string>;
  createActor: <T extends Actor>(args: CreateActorArgs) => Promise<T>;
}

type PublicKeyHex = string;
type SessionData = { agent: HttpAgent; principalId: string; accountId: string } | null;
type PlugProvider = {
  requestConnect: (params: { whitelist?: string[]; host?: string; timeout?: number }) => Promise<PublicKeyHex>;
  isConnected: () => Promise<boolean>;
  sessionManager?: {
    sessionData: SessionData;
  };
};
type BitfinityProvider = {
  requestConnect: (params: { whitelist?: string[]; timeout?: number }) => Promise<PublicKeyHex>;
  isConnected: () => Promise<boolean>;
  createActor: <T extends Actor>(args: CreateActorArgs & { host?: string }) => Promise<T>;
  getPrincipal: () => Promise<Principal>;
  getAccountId: () => Promise<string>;
};

// we can't make it return the same interface, because MSQ uses scoped identities for each token
// so even for a payment flow it has no meaning
export async function connectMSQWallet(): Promise<Result<InternalSnapClient, WalletError>> {
  const result = await MsqClient.create({
    snapId: import.meta.env.VITE_MSQ_SNAP_ID,
    snapVersion: import.meta.env.VITE_MSQ_SNAP_VERSION,
    shouldBeFlask: false,
    debug: import.meta.env.VITE_MSQ_MODE === "DEV",
    //forceReinstall: import.meta.env.VITE_MSQ_MODE === "DEV",
    forceReinstall: false,
  });

  if ("MSQConnectionRejected" in result) {
    return { Err: WalletError.ConnectionRejected };
  }

  if ("InstallMetaMask" in result) {
    return { Err: WalletError.WalletNotInstalled };
  }

  if ("UnblockMSQ" in result) {
    return { Err: WalletError.MSQIsBlocked };
  }

  if ("EnableMSQ" in result) {
    return { Err: WalletError.MSQIsDisabled };
  }

  const client = InternalSnapClient.create((result as TMsqCreateOk).Ok);

  const isAuthorized = await client.getInner().isAuthorized();
  if (!isAuthorized) await client.login(window.location.origin, 0, import.meta.env.VITE_MSQ_SNAP_SITE_ORIGIN);

  return { Ok: client };
}

// connects the plug wallet and returns a common interface
export async function connectPlugWallet(): Promise<Result<IWallet, WalletError>> {
  const w = window as { ic?: { plug?: PlugProvider } };

  if (!w.ic?.plug) {
    return { Err: WalletError.WalletNotInstalled };
  }

  if (w.ic.plug.sessionManager?.sessionData && (await w.ic.plug.isConnected())) {
    return {
      Ok: {
        getPrincipal: async () => Principal.fromText(w.ic?.plug?.sessionManager?.sessionData?.principalId!),
        getAccountId: async () => w.ic?.plug?.sessionManager?.sessionData?.accountId!,
        createActor: async <T extends Actor>(args: CreateActorArgs) =>
          Actor.createActor<T>(args.interfaceFactory, {
            agent: w.ic?.plug?.sessionManager?.sessionData?.agent!,
            canisterId: args.canisterId,
          }),
      },
    };
  }

  try {
    await w.ic.plug.requestConnect({
      whitelist: Object.keys(PRE_LISTED_TOKENS),
      host: getIcHostOrDefault(),
    });
  } catch (e) {
    console.error(e);

    return { Err: WalletError.ConnectionRejected };
  }

  return {
    Ok: {
      getPrincipal: async () => Principal.fromText(w.ic?.plug?.sessionManager?.sessionData?.principalId!),
      getAccountId: async () => w.ic?.plug?.sessionManager?.sessionData?.accountId!,
      createActor: async <T extends Actor>(args: CreateActorArgs) =>
        Actor.createActor<T>(args.interfaceFactory, {
          agent: w.ic?.plug?.sessionManager?.sessionData?.agent!,
          canisterId: args.canisterId,
        }),
    },
  };
}

// connects the bitfinity wallet and returns a common interface
export async function connectBitfinityWallet(): Promise<Result<IWallet, WalletError>> {
  const w = window as { ic?: { bitfinityWallet?: BitfinityProvider } };

  if (!w.ic?.bitfinityWallet) {
    return { Err: WalletError.WalletNotInstalled };
  }

  if (await w.ic.bitfinityWallet.isConnected()) {
    return {
      Ok: {
        getPrincipal: w.ic.bitfinityWallet.getPrincipal,
        getAccountId: w.ic.bitfinityWallet.getAccountId,
        createActor: (args: CreateActorArgs) =>
          w.ic!.bitfinityWallet!.createActor!({ ...args, host: getIcHostOrDefault() }),
      },
    };
  }

  try {
    await w.ic.bitfinityWallet.requestConnect({
      whitelist: Object.keys(PRE_LISTED_TOKENS),
    });
  } catch (e) {
    console.error(e);

    return { Err: WalletError.ConnectionRejected };
  }

  return {
    Ok: {
      getPrincipal: w.ic.bitfinityWallet.getPrincipal,
      getAccountId: w.ic.bitfinityWallet.getAccountId,
      createActor: (args: CreateActorArgs) =>
        w.ic!.bitfinityWallet!.createActor!({ ...args, host: getIcHostOrDefault() }),
    },
  };
}

// logs in through the II and returns a common interface
export async function connectNNSWallet(): Promise<Result<IWallet, WalletError>> {
  const client = await AuthClient.create();

  if (await client.isAuthenticated()) {
    const identity = client.getIdentity();
    const agent = await makeAgent(identity, getIcHostOrDefault());

    return {
      Ok: {
        getPrincipal: agent.getPrincipal,
        getAccountId: async () => AccountIdentifier.fromPrincipal({ principal: await agent.getPrincipal() }).toHex(),
        createActor: async <T extends Actor>(args: CreateActorArgs) =>
          Actor.createActor<T>(args.interfaceFactory, { agent, canisterId: args.canisterId }),
      },
    };
  }

  try {
    await new Promise((res, rej) => client.login({ onSuccess: res, onError: rej }));
  } catch (e) {
    console.error(e);

    return { Err: WalletError.ConnectionRejected };
  }

  const identity = client.getIdentity();
  const agent = await makeAgent(identity, getIcHostOrDefault());

  return {
    Ok: {
      getPrincipal: agent.getPrincipal,
      getAccountId: async () => AccountIdentifier.fromPrincipal({ principal: await agent.getPrincipal() }).toHex(),
      createActor: async <T extends Actor>(args: CreateActorArgs) =>
        Actor.createActor<T>(args.interfaceFactory, { agent, canisterId: args.canisterId }),
    },
  };
}
