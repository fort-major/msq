// @ts-expect-error - did is a .js file
import { idlFactory } from "../declarations/masquerade_backend/masquerade_backend.did";
import { Actor, ActorSubclass, Agent } from "@dfinity/agent";

export type { _SERVICE as Backend } from "../declarations/masquerade_backend/masquerade_backend.did";
import type { _SERVICE as Backend } from "../declarations/masquerade_backend/masquerade_backend.did";

export const canisterId = import.meta.env.VITE_CANISTER_ID_MASQUERADE_BACKEND;

export function createBackendActor(agent: Agent): ActorSubclass<Backend> {
  return Actor.createActor(idlFactory, { agent, canisterId });
}
