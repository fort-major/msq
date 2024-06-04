import { InternalSnapClient, MsqClient, MsqIdentity, TMsqCreateOk } from "@fort-major/msq-client";
import { PRE_LISTED_TOKENS, Principal, TAccountId } from "@fort-major/msq-shared";
import { assertIs, getIcHostOrDefault, makeAgent, makeIcrc1Salt } from ".";
import { Actor, HttpAgent, Identity } from "@dfinity/agent";
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

let client: InternalSnapClient | undefined;
let assetId: string | undefined;
let accountId: TAccountId | undefined;

export async function msqToIWallet(
  _client: InternalSnapClient,
  _assetId: string,
  _accountId: TAccountId,
): Promise<IWallet> {
  client = _client;
  assetId = _assetId;
  accountId = _accountId;

  console.log(client, assetId, accountId);

  return {
    getPrincipal: async () => {
      const it = await MsqIdentity.create(client!.getInner(), makeIcrc1Salt(assetId!, accountId!));
      return it.getPrincipal();
    },
    getAccountId: async () => {
      return MsqIdentity.create(client!.getInner(), makeIcrc1Salt(assetId!, accountId!)).then((it) =>
        AccountIdentifier.fromPrincipal({ principal: it.getPrincipal() }).toHex(),
      );
    },
    createActor: async function <T extends Actor>(args: CreateActorArgs) {
      console.log(client, assetId, accountId);

      const identity = await MsqIdentity.create(client!.getInner(), makeIcrc1Salt(assetId!, accountId!));
      const agent = await makeAgent(identity, getIcHostOrDefault());

      return Actor.createActor<T>(args.interfaceFactory, {
        agent,
        canisterId: args.canisterId,
      });
    },
  };
}

// connects the plug wallet and returns a common interface
export async function connectPlugWallet(): Promise<Result<IWallet, WalletError>> {
  assertIs<{ ic?: { plug?: PlugProvider } }>(window);

  if (!window.ic?.plug) {
    return { Err: WalletError.WalletNotInstalled };
  }

  const wallet = {
    getPrincipal: async () => {
      assertIs<{ ic?: { plug?: PlugProvider } }>(window);

      return Principal.fromText(window.ic?.plug?.sessionManager?.sessionData?.principalId!);
    },
    getAccountId: async () => {
      assertIs<{ ic?: { plug?: PlugProvider } }>(window);

      return window.ic?.plug?.sessionManager?.sessionData?.accountId!;
    },
    createActor: async <T extends Actor>(args: CreateActorArgs) => {
      assertIs<{ ic?: { plug?: PlugProvider } }>(window);

      return Actor.createActor<T>(args.interfaceFactory, {
        agent: window.ic?.plug?.sessionManager?.sessionData?.agent!,
        canisterId: args.canisterId,
      });
    },
  };

  if (await window.ic.plug.isConnected()) {
    return { Ok: wallet };
  }

  try {
    await window.ic.plug.requestConnect({
      whitelist: Object.keys(PRE_LISTED_TOKENS),
      host: getIcHostOrDefault(),
    });
  } catch (e) {
    console.error(e);

    return { Err: WalletError.ConnectionRejected };
  }

  return { Ok: wallet };
}

// connects the bitfinity wallet and returns a common interface
export async function connectBitfinityWallet(): Promise<Result<IWallet, WalletError>> {
  assertIs<{ ic?: { bitfinityWallet?: BitfinityProvider } }>(window);

  if (!window.ic?.bitfinityWallet) {
    return { Err: WalletError.WalletNotInstalled };
  }

  const wallet = {
    getPrincipal: () => {
      assertIs<{ ic?: { bitfinityWallet?: BitfinityProvider } }>(window);

      return window.ic!.bitfinityWallet!.getPrincipal();
    },
    getAccountId: () => {
      assertIs<{ ic?: { bitfinityWallet?: BitfinityProvider } }>(window);

      return window.ic!.bitfinityWallet!.getAccountId();
    },
    createActor: <T extends Actor>(args: CreateActorArgs) => {
      assertIs<{ ic?: { bitfinityWallet?: BitfinityProvider } }>(window);

      return window.ic!.bitfinityWallet!.createActor!({ ...args, host: getIcHostOrDefault() }) as Promise<T>;
    },
  };

  if (await window.ic.bitfinityWallet.isConnected()) {
    return { Ok: wallet };
  }

  try {
    await window.ic.bitfinityWallet.requestConnect({
      whitelist: Object.keys(PRE_LISTED_TOKENS),
    });
  } catch (e) {
    console.error(e);

    return { Err: WalletError.ConnectionRejected };
  }

  return { Ok: wallet };
}

// logs in through the II and returns a common interface
export async function connectNNSWallet(): Promise<Result<IWallet, WalletError>> {
  const wallet = {
    getPrincipal: async () => (await AuthClient.create()).getIdentity().getPrincipal(),
    getAccountId: async () =>
      AccountIdentifier.fromPrincipal({
        principal: (await AuthClient.create()).getIdentity().getPrincipal(),
      }).toHex(),
    createActor: async <T extends Actor>(args: CreateActorArgs) =>
      Actor.createActor<T>(args.interfaceFactory, {
        agent: await makeAgent((await AuthClient.create()).getIdentity(), getIcHostOrDefault()),
        canisterId: args.canisterId,
      }),
  };

  const client = await AuthClient.create();

  if (await client.isAuthenticated()) {
    return { Ok: wallet };
  }

  try {
    await new Promise((res, rej) => client.login({ onSuccess: res, onError: rej }));
  } catch (e) {
    console.error(e);

    return { Err: WalletError.ConnectionRejected };
  }

  return { Ok: wallet };
}
