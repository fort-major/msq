import { IOriginData, ZStateGetOriginDataRequest, fromCBOR, zodParse } from "@fort-major/masquerade-shared";
import { persistStateLocal, retrieveStateLocal } from "../utils";


export async function protected_handleStateGetOriginData(bodyCBOR: string): Promise<IOriginData | undefined> {
    const body = zodParse(ZStateGetOriginDataRequest, fromCBOR(bodyCBOR));

    const state = await retrieveStateLocal();

    return state.originData[body.origin];
}