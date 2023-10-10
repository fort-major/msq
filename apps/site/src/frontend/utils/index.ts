import { ActorSubclass } from "@dfinity/agent";
import { MasqueradeClient } from "@fort-major/masquerade-client/src/client";
import { MasqueradeIdentity } from "@fort-major/masquerade-client/src/identity";
import { InternalSnapClient } from "@fort-major/masquerade-client/src/internal";
import { strToBytes } from "@fort-major/masquerade-shared";
import { Backend } from "../backend";

export function makeCanisterIdIdentity(
  client: MasqueradeClient,
  canisterId: string,
): Promise<MasqueradeIdentity> {
  const salt = `icrc-1\n${canisterId}\n0`;
  return MasqueradeIdentity.create(client, strToBytes(salt));
}

const ONE_DAY = 1000 * 60 * 60 * 24;

export async function handleStatistics(
  actor: ActorSubclass<Backend>,
  client: InternalSnapClient,
) {
  const stats = await client.getStats();
  const now = Date.now();

  if (stats.dev + stats.prod < 1000 || now - stats.lastResetTimestamp < ONE_DAY)
    return;

  await client.resetStats();

  await actor.increment_stats(BigInt(stats.dev), BigInt(stats.prod));
}
