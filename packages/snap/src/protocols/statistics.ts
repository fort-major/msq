import { type IStatistics } from "@fort-major/masquerade-shared";
import { StateManager } from "../state";

/**
 * ## Returns all the statistics the user was able to gather to this moment
 *
 * @returns - {@link IStatistics}
 *
 * @category Protected
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function protected_handleStatisticsGet(): Promise<IStatistics> {
  const manager = await StateManager.make();

  return manager.getStats();
}

/**
 * ## Resets the statistics gathered by the user, making them start from scratch
 *
 * @returns true
 *
 * @category Protected
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function protected_handleStatisticsReset(): Promise<true> {
  const manager = await StateManager.make();

  manager.resetStats();

  await manager.persist();

  return true;
}
