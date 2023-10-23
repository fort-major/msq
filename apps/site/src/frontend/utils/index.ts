import { ActorSubclass, HttpAgent, Identity } from "@dfinity/agent";
import { InternalSnapClient } from "@fort-major/masquerade-client";
import { Backend } from "../backend";
import { ErrorCode, err, unreacheable } from "@fort-major/masquerade-shared";
import { JSXElement } from "solid-js";

const ONE_DAY = 1000 * 60 * 60 * 24;

export async function handleStatistics(actor: ActorSubclass<Backend>, client: InternalSnapClient) {
  const stats = await client.getStats();
  const now = Date.now();

  if (stats.dev + stats.prod < 1000 || now - stats.lastResetTimestamp < ONE_DAY) return;

  await client.resetStats();

  await actor.increment_stats(BigInt(stats.dev), BigInt(stats.prod));
}

export function assertEventSafe(e: Event) {
  if (!e.isTrusted) {
    err(ErrorCode.SECURITY_VIOLATION, "No automation allowed!");
  }
}

export interface IChildren {
  children: JSXElement;
}

export const DUMMY_ACCESSOR = () => undefined;
export const DUMMY_SETTER = DUMMY_ACCESSOR;

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

export class Tokens {
  constructor(
    public readonly symbol: string,
    public readonly decimals: bigint,
    public readonly qty: bigint,
  ) {}

  private static validate(...tokens: Tokens[]) {
    const symbol = tokens[0].symbol;
    const decimals = tokens[0].decimals;

    for (let token of tokens) {
      if (token.symbol !== symbol) unreacheable(`Different token symbols - ${symbol} !== ${token.symbol}`);
      if (token.decimals !== decimals) unreacheable(`Different token decimals - ${decimals} !== ${token.decimals}`);
    }
  }

  static add(a: Tokens, b: Tokens): Tokens {
    Tokens.validate(a, b);

    return new Tokens(a.symbol, a.decimals, a.qty + b.qty);
  }

  static sub(a: Tokens, b: Tokens): Tokens | null {
    Tokens.validate(a, b);

    if (a.qty < b.qty) return null;

    return new Tokens(a.symbol, a.decimals, a.qty - b.qty);
  }

  static mul(a: Tokens, b: Tokens): Tokens {
    Tokens.validate(a, b);

    return new Tokens(a.symbol, a.decimals, a.qty * b.qty);
  }

  static div(a: Tokens, b: Tokens): Tokens {
    Tokens.validate(a, b);

    if (b.qty === BigInt(0)) unreacheable(`Unable to divide ${a.qty} by zero`);

    return new Tokens(a.symbol, a.decimals, a.qty / b.qty);
  }

  static mod(a: Tokens, b: Tokens): Tokens {
    Tokens.validate(a, b);

    if (b.qty === BigInt(0)) unreacheable(`Unable to divide ${a.qty} by zero`);

    return new Tokens(a.symbol, a.decimals, a.qty % b.qty);
  }

  toString(): string {
    return `${this.toStringQty()} ${this.symbol}`;
  }

  toStringQty(): string {
    const decimals = Number(this.decimals);
    const decimalDiv = BigInt(Math.pow(10, decimals));

    const head = this.qty / decimalDiv;
    const tail = this.qty % decimalDiv;

    return `${head.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}.${tail}`;
  }
}
