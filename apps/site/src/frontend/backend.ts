// @ts-expect-error - did is a .js file
import { idlFactory } from "../declarations/msq_statistics/msq_statistics.did";
import { Actor, ActorSubclass, Agent } from "@dfinity/agent";

export type { _SERVICE as StatisticsBackend } from "../declarations/msq_statistics/msq_statistics.did";
import type { _SERVICE as StatisticsBackend } from "../declarations/msq_statistics/msq_statistics.did";
import { Principal } from "@dfinity/principal";
import { ICP_INDEX_TOKEN_IDX, bytesToHex } from "@fort-major/msq-shared";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { DEFAULT_SUBACCOUNT } from "./utils";

export const canisterId = import.meta.env.VITE_CANISTER_ID_MSQ_STATISTICS;

export function createStatisticsBackendActor(agent: Agent): ActorSubclass<StatisticsBackend> {
  return Actor.createActor(idlFactory, { agent, canisterId });
}

export type Hex = string;
// text encoded bigint
export type Dec = string;
// icp account (hex) id or principal(text)+subaccount(hex) hashed as icp account
export type Account = string;

export type TxnKind = "Mint" | "Burn" | "Transfer" | "Approve";

export type TxnExternal = {
  id: Dec;
  kind: TxnKind;
  timestampNano: Dec;
  memo: Hex;
  amount?: Dec; // Mint, Burn, Transfer, Approve (allowance)
  from?: Account; // Burn, Transfer, Approve
  spender?: Account; // Burn, Transfer, Approve
  fee?: Dec; // Transfer, Approve
  to?: Account; // Mint, Transfer
  expiresAtNano?: Dec; // Approve
};

export type Txn = {
  id: bigint;
  sign: "+" | "-";
  timestampMs: number;
  amount: bigint;
  account:
    | {
        principalId: string;
        subaccount?: string;
      }
    | string;
  memo?: string;
};

function convertTxns(accountId: string, txns: TxnExternal[]): Txn[] {
  return txns
    .filter((txn) => txn.kind === "Transfer")
    .map((txn) => {
      const [sign, account] = accountId === txn.from ? ["-", txn.to] : ["+", txn.from];
      let accOrPair:
        | {
            principalId: string;
            subaccount?: string;
          }
        | string;

      if (account!.includes(":")) {
        let [prin, sub]: [string, string | undefined] = account!.split(":") as [string, string];

        // TODO: calculate default subaccount once
        if (sub === bytesToHex(new Uint8Array(32))) {
          sub = undefined;
        }

        accOrPair = { principalId: prin, subaccount: sub };
      } else {
        accOrPair = account!;
      }

      return {
        id: BigInt(txn.id),
        sign: sign as "-" | "+",
        account: accOrPair,
        amount: BigInt(txn.amount!),
        memo: txn.memo,
        timestampMs: Number(BigInt(txn.timestampNano) / 1000000n),
      };
    });
}

const API_BACKEND_HOST = "https://api.msq.tech";

const mockTxns: Txn[] = [
  {
    id: 123456789n,
    account: "745ec913e0bcb1cc2ab59968f99144bdf8a5fc48405d5e98f9f89561a3c9cc3a",
    amount: 170_00000000n,
    sign: "+",
    timestampMs: Date.now(),
    memo: "0a77f9874bbd08ba000000000000000000000000000000000000000000000000",
  },
  {
    id: 123456789n,
    account: {
      principalId: "dasdk-dasdd-dsasd-dasda-fdads-dsdaz-qwerd-trtes-dasda",
      subaccount: "745ec913e0bcb1cc2ab59968f99144bdf8a5fc48405d5e98f9f89561a3c9cc3a",
    },
    amount: 98_123_456_12345678n,
    sign: "-",
    timestampMs: Date.now(),
    memo: "0a77f9874bbd08ba000000000000000000000000000000000000000000000000",
  },
  {
    id: 12345678912345n,
    account: "745ec913e0bcb1cc2ab59968f99144bdf8a5fc48405d5e98f9f89561a3c9cc3a",
    amount: 170_12345678n,
    sign: "+",
    timestampMs: Date.now(),
    memo: "0a77f9874bbd08ba000000000000000000000000000000000000000000000000",
  },
  {
    id: 123456789n,
    account: {
      principalId: "dasdk-dasdd-dsasd-dasda-fdads-dsdaz-qwerd-trtes-dasda",
    },
    amount: 170_00000000n,
    sign: "-",
    timestampMs: Date.now(),
  },
  {
    id: 123456789n,
    account: {
      principalId: "dasdk-dasdd-dsasd-dasda-fdads-dsdaz-qwerd-trtes-dasda",
      subaccount: "745ec913e0bcb1cc2ab59968f99144bdf8a5fc48405d5e98f9f89561a3c9cc3a",
    },
    amount: 170_00000000n,
    sign: "+",
    timestampMs: Date.now(),
    memo: "0a77f9874bbd08ba000000000000000000000000000000000000000000000000",
  },
];

export async function getTransactionHistory(args: {
  tokenId: string | Principal;
  accountPrincipalId: string | Principal;
  skip?: bigint;
  take?: number;
}): Promise<Txn[]> {
  if (typeof args.accountPrincipalId === "string")
    args.accountPrincipalId = Principal.fromText(args.accountPrincipalId);
  if (typeof args.tokenId !== "string") args.tokenId = args.tokenId.toText();
  if (args.skip === undefined) args.skip = 0n;
  if (args.take === undefined) args.take = 10;

  const query = `tokenId=${args.tokenId}&actorPrincipalId=${args.accountPrincipalId.toText()}&skip=${args.skip}&take=${
    args.take
  }`;
  const response = await fetch(new URL(`/api/v1/txn?${query}`, API_BACKEND_HOST));

  const txns: TxnExternal[] = await response.json();

  const accountId = ICP_INDEX_TOKEN_IDX.includes(args.tokenId)
    ? AccountIdentifier.fromPrincipal({ principal: args.accountPrincipalId }).toHex()
    : `${args.accountPrincipalId.toText()}:${bytesToHex(new Uint8Array(32))}`;

  return convertTxns(accountId, txns);
}
