// @ts-expect-error
import { idlFactory } from '../../declarations/site_backend/site_backend.did';
import { Actor, ActorSubclass, Agent } from '@dfinity/agent';

export const canisterId = import.meta.env.VITE_CANISTER_ID_SITE_BACKEND;

export function createActor<T>(canisterId: string, agent: Agent): ActorSubclass<T> {
    if (import.meta.env.DFX_NETWORK !== "ic") {
        agent.fetchRootKey().catch((err) => {
            console.warn(
                "Unable to fetch root key. Check to ensure that your local replica is running"
            );
            console.error(err);
        });
    }

    return Actor.createActor(idlFactory, { agent, canisterId });
};