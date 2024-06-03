export { idlFactory as ICRC1IDLFactory } from "@dfinity/ledger-icrc/dist/candid/icrc_ledger.idl";
import type { _SERVICE as ICRC1Token } from "@dfinity/ledger-icrc/dist/candid/icrc_ledger";
export type { _SERVICE as ICRC1Token } from "@dfinity/ledger-icrc/dist/candid/icrc_ledger";

export type ReplicateFields<T> = {
  [K in keyof T as `${string & K}_replicated`]: T[K];
};

export type WithReplicatedFields<T> = T & ReplicateFields<T>;

export type ICRC1TokenReplicated = WithReplicatedFields<ICRC1Token>;
