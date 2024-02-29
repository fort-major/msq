import {
  IStatisticsData,
  type IStatistics,
  ZStatisticsData,
  zodParse,
  fromCBOR,
  ZStatisticsIncrementRequest,
} from "@fort-major/msq-shared";
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
 * ## Increment one of the statistics topics
 *
 * @param
 * @returns - {@link IStatistics}
 *
 * @category Protected
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function protected_handleStatisticsIncrement(bodyCBOR: string): Promise<true> {
  const { data } = zodParse(ZStatisticsIncrementRequest, fromCBOR(bodyCBOR));

  const manager = await StateManager.make();

  manager.incrementStats(data);

  return true;
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

  return true;
}
