import { ActorSubclass } from "@dfinity/agent";
import { InternalSnapClient } from "@fort-major/masquerade-client";
import { Backend } from "../backend";

const ONE_DAY = 1000 * 60 * 60 * 24;

export async function handleStatistics(actor: ActorSubclass<Backend>, client: InternalSnapClient) {
  const stats = await client.getStats();
  const now = Date.now();

  if (stats.dev + stats.prod < 1000 || now - stats.lastResetTimestamp < ONE_DAY) return;

  await client.resetStats();

  await actor.increment_stats(BigInt(stats.dev), BigInt(stats.prod));
}
