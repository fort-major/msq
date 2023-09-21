// @ts-expect-error
import { idlFactory } from '../declarations/demo_backend/demo_backend.did';
import { Actor, ActorSubclass, Agent } from '@dfinity/agent';

export type { _SERVICE as Backend } from '../declarations/demo_backend/demo_backend.did';
import type { _SERVICE as Backend } from '../declarations/demo_backend/demo_backend.did';

export const canisterId = import.meta.env.VITE_CANISTER_ID_DEMO_BACKEND;

export function createBackendActor(agent: Agent): ActorSubclass<Backend> {
    return Actor.createActor(idlFactory, { agent, canisterId });
};