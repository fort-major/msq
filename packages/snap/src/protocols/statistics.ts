import { IStatistics } from "@fort-major/masquerade-shared";
import { StateManager } from "../state";

export async function protected_handleStatisticsGet(): Promise<IStatistics> {
    const manager = await StateManager.make();

    return manager.getStats();
}

export async function protected_handleStatisticsReset(): Promise<true> {
    const manager = await StateManager.make();

    manager.resetStats();

    await manager.persist();

    return true;
}