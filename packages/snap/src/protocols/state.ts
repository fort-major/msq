import { TOrigin } from "@fort-major/masquerade-shared";
import { StateManager } from "../state";


export async function handleStateSessionExists(origin: TOrigin): Promise<boolean> {
    const manager = await StateManager.make();

    return !!manager.getOriginData(origin).currentSession;
}