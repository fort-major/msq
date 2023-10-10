import { type IStatistics } from "@fort-major/masquerade-shared";
import { StateManager } from "../state";

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function protected_handleStatisticsGet(): Promise<IStatistics> {
  const manager = await StateManager.make();

  return manager.getStats();
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function protected_handleStatisticsReset(): Promise<true> {
  const manager = await StateManager.make();

  manager.resetStats();

  await manager.persist();

  return true;
}
