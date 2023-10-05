import { TOrigin } from "@fort-major/masquerade-shared";
import { StateManager } from "../state";


export async function handleStateSessionExists(origin: TOrigin): Promise<boolean> {
    const manager = await StateManager.make();

    manager.incrementStats(origin);
    await manager.persist();

    return !!manager.getOriginData(origin).currentSession;
}