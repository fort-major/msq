import { HttpAgent, Identity } from "@dfinity/agent";
import { InternalSnapClient } from "@fort-major/masquerade-client";
import { createStatisticsBackendActor } from "../backend";
import { ErrorCode, err } from "@fort-major/masquerade-shared";
import { JSX, JSXElement } from "solid-js";
import { IcrcLedgerCanister, IcrcMetadataResponseEntries } from "@dfinity/ledger-icrc";

export const DEFAULT_PRINCIPAL = "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa";
export const DEFAULT_SUBACCOUNT = "ba35d85f5e781927cb545aa00048fd86cfb4f444baedd00baa701405251bf109";
export const ONE_SEC_MS = 1000;
export const ONE_MIN_MS = ONE_SEC_MS * 60;
export const ONE_HOUR_MS = ONE_MIN_MS * 60;
export const ONE_DAY_MS = ONE_HOUR_MS * 24;
export const ONE_WEEK_MS = ONE_DAY_MS * 7;

export async function handleStatistics(agent: HttpAgent, client: InternalSnapClient) {
  const stats = await client.getStats();
  const now = Date.now();

  if (now - stats.lastResetTimestamp < ONE_DAY_MS) return;
  const statisticsBackend = createStatisticsBackendActor(agent);

  await client.resetStats();
  await statisticsBackend.increment_stats(stats.prod);
}

export function assertEventSafe(e: Event) {
  if (!e.isTrusted) {
    err(ErrorCode.SECURITY_VIOLATION, "No automation allowed!");
  }
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

export async function makeAgent(identity?: Identity | undefined): Promise<HttpAgent> {
  const agent = new HttpAgent({ host: import.meta.env.VITE_MSQ_DFX_NETWORK_HOST, identity });

  if (import.meta.env.VITE_MSQ_MODE === "DEV") {
    await agent.fetchRootKey();
  }

  return agent;
}

export function tokensToStr(qty: bigint, decimals: number, trimTail: boolean = true): string {
  if (qty === BigInt(0)) {
    return "0";
  }

  const decimalDiv = BigInt(Math.pow(10, decimals));

  const head = qty / decimalDiv;
  const tail = qty % decimalDiv;

  const headFormatted = head.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

  if (tail === BigInt(0)) {
    return headFormatted;
  }

  const tailFormatted = tail.toString().padStart(decimals, "0");
  const tailTrimmed = trimTail ? tailFormatted.slice(0, Math.min(decimals, 4)) : tailFormatted;

  return `${headFormatted}.${tailTrimmed}`;
}

export function strToTokens(str: string, decimals: number): bigint {
  let [head, tail] = str.split(".") as [string, string | undefined];
  head = head.replaceAll(",", "");

  const decimalMul = BigInt(Math.pow(10, decimals));

  if (tail === undefined) {
    return BigInt(head) * decimalMul;
  }

  return BigInt(head) * decimalMul + BigInt(tail.padEnd(decimals, "0"));
}

export interface IAssetMetadata {
  name: string;
  symbol: string;
  decimals: number;
  fee: bigint;
}

export async function getAssetMetadata(ledger: IcrcLedgerCanister, assetId: string): Promise<IAssetMetadata> {
  const metadata = await ledger.metadata({ certified: true });

  const name = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.NAME)![1] as { Text: string }).Text;
  const symbol = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.SYMBOL)![1] as { Text: string }).Text;
  const fee = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.FEE)![1] as { Nat: bigint }).Nat;
  const decimals = (metadata.find((it) => it[0] === IcrcMetadataResponseEntries.DECIMALS)![1] as { Nat: bigint }).Nat;

  return { name, symbol, fee, decimals: Number(decimals) };
}

export function getClassName(comp: { class: (props: JSX.HTMLAttributes<any>) => string }): string {
  return comp.class({});
}
