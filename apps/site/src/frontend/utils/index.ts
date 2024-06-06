import { Agent, AnonymousIdentity, HttpAgent, Identity } from "@dfinity/agent";
import { InternalSnapClient } from "@fort-major/msq-client";
import { createStatisticsBackendActor } from "../backend";
import {
  ErrorCode,
  IStatistics,
  PRE_LISTED_TOKENS,
  Principal,
  TAccountId,
  debugStringify,
  err,
  fromCBOR,
  strToBytes,
  toCBOR,
} from "@fort-major/msq-shared";
import { Accessor, JSX, JSXElement, Setter, createSignal } from "solid-js";
import { IcrcLedgerCanister, IcrcMetadataResponseEntries } from "@dfinity/ledger-icrc";
import D from "dompurify";
import { AccountIdentifier } from "@dfinity/ledger-icp";

// null = default
// <string> = custom host
export function setIcHost(host: string | null = null) {
  if (host === null) {
    localStorage.removeItem("msq-ic-host");
  } else {
    localStorage.setItem("msq-ic-host", JSON.stringify(host));
  }
}
export function getIcHost(): string | null {
  const host = localStorage.getItem("msq-ic-host");

  if (host === null) return null;

  return JSON.parse(host);
}

if (getIcHost() === null) {
  setIcHost(import.meta.env.VITE_MSQ_DFX_NETWORK_HOST);
}

(window as any).setIcHost = setIcHost;
(window as any).getIcHost = getIcHost;

export const DEFAULT_PRINCIPAL = Principal.anonymous().toText();
export const DEFAULT_SUBACCOUNT = "ba35d85f5e781927cb545aa00048fd86cfb4f444baedd00baa701405251bf109";
export const ONE_SEC_MS = 1000;
export const ONE_MIN_MS = ONE_SEC_MS * 60;
export const ONE_HOUR_MS = ONE_MIN_MS * 60;
export const ONE_DAY_MS = ONE_HOUR_MS * 24;
export const ONE_WEEK_MS = ONE_DAY_MS * 7;

export async function handleStatistics(agent: Agent, client: InternalSnapClient) {
  const stats = await client.getStats();
  const now = Date.now();

  if (now - stats.lastResetTimestamp < ONE_DAY_MS) return;
  if (!checkStats(stats)) return;

  const statisticsBackend = createStatisticsBackendActor(agent);

  await statisticsBackend.increment_stats(stats.data);
  await client.resetStats();
}

function checkStats(stats: IStatistics): boolean {
  if (stats.data.login !== 0) return true;
  if (stats.data.transfer !== 0) return true;
  if (stats.data.origin_link !== 0) return true;
  if (stats.data.origin_unlink !== 0) return true;

  return false;
}

export interface IChildren {
  children: JSXElement;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function timestampToStr(timestampMs: number) {
  const date = new Date(timestampMs);
  const day = date.getDate().toString().padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear().toString();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export async function makeAgent(identity?: Identity | undefined, host?: string): Promise<Agent> {
  const storedHost = getIcHost();

  let icHost: string | undefined;
  if (host !== undefined) {
    icHost = host;
  } else {
    icHost = storedHost === null ? import.meta.env.VITE_MSQ_DFX_NETWORK_HOST : storedHost;
  }

  const agent = new HttpAgent({ host: icHost, identity, retryTimes: 10 });

  if (icHost) {
    await agent.fetchRootKey();
  }

  return agent;
}

export async function makeAnonymousAgent(host?: string): Promise<Agent> {
  const id = new AnonymousIdentity();
  return makeAgent(id, host);
}

export interface IAssetMetadata {
  name: string;
  symbol: string;
  decimals: number;
  fee: bigint;
  logoSrc?: string;
}

export async function getAssetMetadata(
  ledger: IcrcLedgerCanister,
  certified: boolean = false,
): Promise<IAssetMetadata> {
  const cachedMetadata = getCachedAssetMetadata(ledger.canisterId);
  if (cachedMetadata) return Promise.resolve(cachedMetadata);

  const metadata = await ledger.metadata({ certified });

  const name = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.NAME)![1] as { Text: string }).Text;
  const symbol = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.SYMBOL)![1] as { Text: string }).Text;
  const fee = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.FEE)![1] as { Nat: bigint }).Nat;
  const decimals = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.DECIMALS)![1] as { Nat: bigint }).Nat;

  let logoEntry = metadata.find((it) => it[0] === IcrcMetadataResponseEntries.LOGO);
  let logo: string | undefined = undefined;

  if (logoEntry) {
    logo = (logoEntry![1] as { Text: string }).Text;
    // base64 decode svg, so it could be xss-purified, then encode back
    if (logo.includes("image/svg")) {
      if (logo.includes("base64")) {
        let [prefix, body] = logo.split(";base64,");
        body = btoa(D.sanitize(atob(body)));
        logo = `${prefix};base64,${body}`;
      } else {
        let [prefix, body] = logo.split(",");
        body = D.sanitize(body);
        logo = `${prefix},${body}`;
      }
    }
  }

  if (typeof fee !== "bigint" || typeof decimals !== "bigint") {
    err(ErrorCode.ICRC1_ERROR, "Invalid metadata");
  }

  const formatted: IAssetMetadata = {
    name: D.sanitize(name),
    symbol: D.sanitize(symbol),
    fee,
    decimals: Number(decimals),
    logoSrc: logo ? D.sanitize(logo) : defaultLogo(ledger.canisterId.toText()),
  };

  if (certified) {
    cacheAssetMetadata(ledger.canisterId, formatted);
  }

  return formatted;
}

interface ICachedAssetMetadata {
  cachedAt: number;
  metadata: IAssetMetadata;
}

const TWENTY_FOUR_HOURS_MS = 1000 * 60 * 60 * 24;

/**
 * Caches ICRC-1 metadata of a particular token in localStorage with 24-hour expiry
 *
 * @param canisterId
 * @returns
 */
function getCachedAssetMetadata(canisterId: Principal): IAssetMetadata | null {
  const key = `msq-icrc1-asset-metadata/${canisterId.toText()}`;
  const resultRaw = localStorage.getItem(key);

  if (!resultRaw) return null;
  const result: ICachedAssetMetadata = fromCBOR(resultRaw);

  const now = Date.now();

  if (now - result.cachedAt > TWENTY_FOUR_HOURS_MS) return null;

  return result.metadata;
}

function cacheAssetMetadata(canisterId: Principal, metadata: IAssetMetadata) {
  const key = `msq-icrc1-asset-metadata/${canisterId.toText()}`;
  const cachedMetadata: ICachedAssetMetadata = {
    cachedAt: Date.now(),
    metadata,
  };

  localStorage.setItem(key, toCBOR(cachedMetadata));
}

export function defaultLogo(assetId: string): string | undefined {
  return PRE_LISTED_TOKENS[assetId]?.logoSrc;
}

export function getClassName(comp: { class: (props: JSX.HTMLAttributes<any>) => string }): string {
  return comp.class({});
}

export function truncateStr(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + "..." : str;
}

export function createPaymentLink(
  kind: "t" | "d",
  assetId: string,
  recipientPrincipal: string,
  amount?: bigint,
  recipientSubaccount?: string,
  memo?: string,
): URL {
  const baseUrl = new URL("pay", import.meta.env.VITE_MSQ_SNAP_SITE_ORIGIN);
  const params = baseUrl.searchParams;

  if (amount) {
    params.append("amount", amount.toString());
  }

  params.append("canister-id", assetId);
  params.append("to-principal", recipientPrincipal);

  if (recipientSubaccount) {
    params.append("to-subaccount", recipientSubaccount);
  }

  if (memo) {
    params.append("memo", memo);
  }

  params.append("kind", kind);

  return baseUrl;
}

// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
const keys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "PageUp", "PageDown", "End", "Home"]);

function preventDefault(e: Event) {
  e.preventDefault();
}

function preventDefaultForScrollKeys(e: KeyboardEvent) {
  if (keys.has(e.key)) {
    preventDefault(e);
    return false;
  }
}

// modern Chrome requires { passive: false } when adding event
var supportsPassive = false;
try {
  // @ts-expect-error
  window.addEventListener(
    "test",
    null,
    Object.defineProperty({}, "passive", {
      get: function () {
        supportsPassive = true;
      },
    }),
  );
} catch (e) {}

const wheelOpt = supportsPassive ? { passive: false } : false;
const wheelEvent = "onwheel" in document.createElement("div") ? "wheel" : "mousewheel";

export function disableScroll() {
  window.addEventListener("DOMMouseScroll", preventDefault, false); // older FF
  window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
  window.addEventListener("touchmove", preventDefault, wheelOpt); // mobile
  window.addEventListener("keydown", preventDefaultForScrollKeys, false);
}

export function enableScroll() {
  window.removeEventListener("DOMMouseScroll", preventDefault, false);
  // @ts-expect-error
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
  // @ts-expect-error
  window.removeEventListener("touchmove", preventDefault, wheelOpt);
  window.removeEventListener("keydown", preventDefaultForScrollKeys, false);
}

export function createLocalStorageSignal<T extends unknown>(key: string): [Accessor<T>, Setter<T>] {
  const storage = window.localStorage;
  const initialValue: T = JSON.parse(storage.getItem(key) ?? "{}").value;

  const [value, setValue] = createSignal<T>(initialValue);

  const newSetValue = (newValue: T | ((v: T) => T)): T => {
    const _val: T =
      typeof newValue === "function"
        ? // @ts-expect-error
          newValue(value())
        : newValue;

    setValue(_val as any);
    storage.setItem(key, JSON.stringify({ value: _val }));

    return _val;
  };

  return [value, newSetValue as Setter<T>];
}

export function createTransactionHistoryLink(tokenId: Principal, accountId: Principal): string | null {
  const tokenIdStr = tokenId.toText();

  // icp
  if (tokenIdStr === "ryjl3-tyaaa-aaaaa-aaaba-cai") {
    const address = AccountIdentifier.fromPrincipal({ principal: accountId }).toHex();

    return `https://dashboard.internetcomputer.org/account/${address}`;
  }

  // ogy
  if (tokenIdStr === "jwcfb-hyaaa-aaaaj-aac4q-cai") {
    const address = AccountIdentifier.fromPrincipal({ principal: accountId }).toHex();

    return `https://governance.origyn.network/account/${address}`;
  }

  // ckbtc
  if (tokenIdStr === "mxzaz-hqaaa-aaaar-qaada-cai") {
    return `https://dashboard.internetcomputer.org/bitcoin/account/${accountId.toText()}`;
  }

  // cketh
  if (tokenIdStr === "ss2fx-dyaaa-aaaar-qacoq-cai") {
    return `https://dashboard.internetcomputer.org/ethereum/account/${accountId.toText()}`;
  }

  // sns
  const snsId = PRE_LISTED_TOKENS[tokenIdStr]?.snsId;

  if (!snsId) return null;

  return `https://dashboard.internetcomputer.org/sns/${snsId}/account/${accountId.toText()}`;
}

export function canCreateTransactionHistoryLink(tokenId: string, accountId?: string): boolean {
  if (!accountId) return false;

  // icp
  if (tokenId === "ryjl3-tyaaa-aaaaa-aaaba-cai") return true;

  // ogy
  if (tokenId === "jwcfb-hyaaa-aaaaj-aac4q-cai") return true;

  // ckbtc
  if (tokenId === "mxzaz-hqaaa-aaaar-qaada-cai") return true;

  // cketh
  if (tokenId === "ss2fx-dyaaa-aaaar-qacoq-cai") return true;

  // sns
  const snsId = PRE_LISTED_TOKENS[tokenId]?.snsId;
  if (!snsId) return false;

  return true;
}

export function createICRC1TransactionLink(tokenId: Principal, txnIndex: bigint): string | null {
  const tokenIdStr = tokenId.toText();

  // ckbtc
  if (tokenIdStr === "mxzaz-hqaaa-aaaar-qaada-cai") {
    return `https://dashboard.internetcomputer.org/bitcoin/transaction/${txnIndex}`;
  }

  // cketh
  if (tokenIdStr === "ss2fx-dyaaa-aaaar-qacoq-cai") {
    return `https://dashboard.internetcomputer.org/ethereum/transaction/${txnIndex}`;
  }

  const snsId = PRE_LISTED_TOKENS[tokenIdStr]?.snsId;

  if (!snsId) return null;

  return `https://dashboard.internetcomputer.org/sns/${snsId}/transaction/${txnIndex}`;
}

// ---------- SECURITY RELATED STUFF ------------

export function eventHandler<E extends Event>(fn: (e: E) => void | Promise<void>) {
  return (e: E) => {
    if (!e.isTrusted) {
      e.preventDefault();
      e.stopImmediatePropagation();

      err(ErrorCode.SECURITY_VIOLATION, "No automation allowed!");
    }

    Promise.resolve(fn(e)).catch((e) => err(ErrorCode.UNKOWN, debugStringify(e)));
  };
}

export function makeIcrc1Salt(assetId: string, accountId: TAccountId): Uint8Array {
  return strToBytes(`\xacicrc1\n${assetId}\n${accountId}`);
}

export const SHOULD_BE_FLASK = false;
