import { IOriginData, ZStateGetOriginDataRequest, fromCBOR } from "@fort-major/ic-snap-shared";
import { retrieveStateLocal } from "../utils";

export async function protected_handleStateGetOriginData(bodyCBOR: string): Promise<IOriginData | undefined> {
    const body = ZStateGetOriginDataRequest.parse(fromCBOR(bodyCBOR));

    const state = await retrieveStateLocal();

    return state.originData[body.origin];
}