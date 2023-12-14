import { Agent, AnonymousIdentity, HttpAgent, Identity } from "@dfinity/agent";
import { InternalSnapClient } from "@fort-major/masquerade-client";
import { createStatisticsBackendActor } from "../backend";
import { ErrorCode, TAccountId, debugStringify, err, hexToBytes, strToBytes } from "@fort-major/masquerade-shared";
import { JSX, JSXElement } from "solid-js";
import { IcrcLedgerCanister, IcrcMetadataResponseEntries } from "@dfinity/ledger-icrc";

// null = default
// <empty string> = ic
// <string> = custom host
export function setIcHost(host: string | null) {
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

export const DEFAULT_PRINCIPAL = "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa";
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
  const statisticsBackend = createStatisticsBackendActor(agent);

  await client.resetStats();
  await statisticsBackend.increment_stats(stats.prod);
}

export interface IChildren {
  children: JSXElement;
}

export function timestampToStr(timestampMs: number) {
  const date = new Date(timestampMs);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export async function makeAgent(identity?: Identity | undefined, host?: string): Promise<Agent> {
  const storedHost = getIcHost();

  let icHost: string | undefined;
  if (host !== undefined) {
    icHost = host;
  } else {
    icHost = storedHost === null ? import.meta.env.VITE_MSQ_DFX_NETWORK_HOST : storedHost;
  }

  const agent = new HttpAgent({ host: icHost, identity });

  if (icHost) {
    await agent.fetchRootKey();
  }

  return agent;
}

export async function makeAnonymousAgent(host?: string): Promise<Agent> {
  const id = new AnonymousIdentity();
  return makeAgent(id, host);
}

export function tokensToStr(
  qty: bigint,
  decimals: number,
  padTail: boolean = false,
  insertQuotes: boolean = false,
): string {
  // 0.0 -> 0
  if (qty === BigInt(0)) {
    return "0";
  }

  // todo: Math.pow() to bitshift
  const decimalDiv = BigInt(Math.pow(10, decimals));

  const head = qty / decimalDiv;
  const tail = qty % decimalDiv;

  let headFormatted = head.toString();

  // 1000000.0 -> 1'000'000.0
  if (insertQuotes) {
    headFormatted = headFormatted.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, "'");
  }

  // 1,000.0 -> 1,000
  if (tail === BigInt(0)) {
    return headFormatted;
  }

  // 1'000.10 -> 1'000.00000010
  const tailFormatted = tail.toString().padStart(decimals, "0");

  // 1'000.00012300 -> 1'000.000123
  let tailPadded: string = tailFormatted;
  if (!padTail) {
    while (tailPadded.charAt(tailPadded.length - 1) === "0") {
      tailPadded = tailPadded.slice(0, -1);
    }
  }

  return `${headFormatted}.${tailPadded}`;
}

export function strToTokens(str: string, decimals: number): bigint {
  // 1'000.123 -> 1'000 & 123
  let [head, tail] = str.split(".") as [string, string | undefined];
  // 1'000 -> 1000
  head = head.replaceAll("'", "");

  // todo: Math.pow() to bitshift
  const decimalMul = BigInt(Math.pow(10, decimals));

  if (!tail) {
    return BigInt(head) * decimalMul;
  }

  // 00001000 -> 1000
  let i = 0;
  while (tail.charAt(0) === "0") {
    tail = tail.slice(1, tail.length);
    i++;
  }

  if (tail === "") {
    return BigInt(head) * decimalMul;
  }

  if (tail.length > decimals) {
    throw `Too many decimal digits (max ${decimals})`;
  }

  // 123 -> 12300000
  tail = tail.padEnd(decimals - i, "0");

  return BigInt(head) * decimalMul + BigInt(tail);
}

export interface IAssetMetadata {
  name: string;
  symbol: string;
  decimals: number;
  fee: bigint;
}

export async function getAssetMetadata(
  ledger: IcrcLedgerCanister,
  certified: boolean = false,
): Promise<IAssetMetadata> {
  const metadata = await ledger.metadata({ certified });

  const name = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.NAME)![1] as { Text: string }).Text;
  const symbol = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.SYMBOL)![1] as { Text: string }).Text;
  const fee = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.FEE)![1] as { Nat: bigint }).Nat;
  const decimals = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.DECIMALS)![1] as { Nat: bigint }).Nat;

  // TODO: add xss purification

  return { name, symbol, fee, decimals: Number(decimals) };
}

export function getClassName(comp: { class: (props: JSX.HTMLAttributes<any>) => string }): string {
  return comp.class({});
}

const MSQ_MEMOS = [
  "83b07a4ce1709f7b77a4e9bc4ac00a49de13ce99d5e76a0a1c4c7455350f7a34",
  "df083fb1bf5eabf830f111769848461c603099e884389d07171dd8048bbfdadb",
  "f6bd79f96ef58c9cfbcb46d420cc3ad6389bd90d4d4cd5dc95bbcf53d1105973",
  "da65a9d7a0efdfddf79ab33cfeb1da4ace2b522004e6939b8cfc4c3c6df78528",
  "293379697d8e4c4603cc58e5c59d19e8b797d979553ee4ab56c8f7fe78a0ee8c",
  "ba20c55ac984170a3a7536d8f0ccbc64204ca54f037fb17fbc81a9ea324e8ca1",
  "e0101f8f3b58b6fa535f1f7bee443c0e327e6463614bc7acf9c1b06fe6067e86",
  "195398033db920c02106bc5820a458785cd703b86b6dd50e6377d97ff240169c",
  "0ea1f625dfe7a61301008a6d0d837531c2d4f5dc1145712a45b12087c3de3ecd",
  "ce71f46798ed04adeb656dc83c57598b8273b8043fcf7f111ebcf3fdfcf8c402",
  "bd5ea9f6128b501a61a307f5f085760002452c26b9e26cdb84c842eaebcfb4d5",
  "c296eef2fff4288028ab6ea6730823df8e706adee2d89292b06c0ff912bf8f21",
  "39b578ec01ff08e8ca1e699b40f380d86e0480f57fd75ccb84cd2fc5b318d4bd",
  "a0f45b1de3d665baa2d24d6a351098a5fa41672526398e6cea1a4a8d7b9e35ab",
  "55d8f666c5ef7fa43f4364a4df1d2f83934ff36c6755159efa5a6ecbe33e2650",
  "5ee9eb84d459ca585dba872339313d20e801ab5c38097ffa6084466372fad649",
  "f0ef77af015de7d9083a2abf93e0fda42bee042ff2965624c692144357d6be4c",
  "e010e60c2ee5f82c84e3a06c47f16d11174d1fec301c3e1cb6a5db7d4555d90d",
  "f33e12cd9e796c38bf06c07f181f0d903ae401f96a801daef2834c42ef9813d4",
  "55999a3e977b06ce2ef3694908eaab62bae25f0bef08edd047638ed18da95e21",
];

export function getRandomMemo(): Uint8Array {
  return hexToBytes(MSQ_MEMOS[Math.floor(Math.random() * MSQ_MEMOS.length)]);
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

  params.append("kind", kind);
  params.append("canister-id", assetId);
  params.append("to-principal", recipientPrincipal);

  if (recipientSubaccount) {
    params.append("to-subaccount", recipientSubaccount);
  }

  if (amount) {
    params.append("amount", amount.toString());
  }

  if (memo) {
    params.append("memo", memo);
  }

  return baseUrl;
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

export const SHOULD_BE_FLASK = true;
