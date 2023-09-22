import { IOriginData, ISiteSession, ZSiteSession, ZStateGetOriginDataRequest, fromCBOR, zodParse } from "@fort-major/ic-snap-shared";
import { persistStateLocal, retrieveStateLocal } from "../utils";

export async function protected_handleStateGetOriginData(bodyCBOR: string): Promise<IOriginData | undefined> {
    const body = zodParse(ZStateGetOriginDataRequest, fromCBOR(bodyCBOR));

    const state = await retrieveStateLocal();

    return state.originData[body.origin];
}

export async function protected_handleStateGetSiteSession(): Promise<ISiteSession | undefined> {
    const state = await retrieveStateLocal();

    return state.siteSession;
}

export async function protected_handleStateSetSiteSession(bodyCBOR: string): Promise<true> {
    const body = zodParse(ZSiteSession, fromCBOR(bodyCBOR));
    const state = await retrieveStateLocal();

    state.siteSession = body;

    await persistStateLocal(state);

    return true;
}