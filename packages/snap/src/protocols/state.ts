import { IOriginData, TOrigin, ZStateGetOriginDataRequest, fromCBOR, zodParse } from "@fort-major/masquerade-shared";
import { StateManager } from "../state";


export async function protected_handleStateGetOriginData(bodyCBOR: string): Promise<IOriginData | undefined> {
    const body = zodParse(ZStateGetOriginDataRequest, fromCBOR(bodyCBOR));
    const manager = await StateManager.make();

    return manager.getOriginData(body.origin);
}

export async function handleSessionExists(origin: TOrigin): Promise<boolean> {
    const manager = await StateManager.make();

    return !!manager.getOriginData(origin).currentSession;
}