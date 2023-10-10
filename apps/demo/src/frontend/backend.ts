// @ts-expect-error - did file is javascript
import { idlFactory } from "../declarations/demo_backend/demo_backend.did";
import { Actor, type ActorSubclass, type Agent } from "@dfinity/agent";
import type { _SERVICE as Backend } from "../declarations/demo_backend/demo_backend.did";

export type { _SERVICE as Backend } from "../declarations/demo_backend/demo_backend.did";

export const canisterId = import.meta.env.VITE_CANISTER_ID_DEMO_BACKEND;

export function createBackendActor(agent: Agent): ActorSubclass<Backend> {
  return Actor.createActor(idlFactory, { agent, canisterId });
}
