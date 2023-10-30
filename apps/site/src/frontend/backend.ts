// @ts-expect-error - did is a .js file
import { idlFactory } from "../declarations/msq_statistics/msq_statistics.did";
import { Actor, ActorSubclass, Agent } from "@dfinity/agent";

export type { _SERVICE as StatisticsBackend } from "../declarations/msq_statistics/msq_statistics.did";
import type { _SERVICE as StatisticsBackend } from "../declarations/msq_statistics/msq_statistics.did";

export const canisterId = import.meta.env.VITE_CANISTER_ID_MSQ_STATISTICS;

export function createStatisticsBackendActor(agent: Agent): ActorSubclass<StatisticsBackend> {
  return Actor.createActor(idlFactory, { agent, canisterId });
}
