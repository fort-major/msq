import { IIdentityAddRequest, IIdentityLoginRequest, IOriginData, IStateGetOriginDataRequest, SNAP_METHODS, TIdentityId, TOrigin } from "@fort-major/masquerade-shared";
import { SnapClient } from "./client";

export interface IInternalSnapClientParams {
    snapId?: string | undefined,
    snapVersion?: string | undefined,
    shouldBeFlask?: boolean | undefined,
    debug?: boolean | undefined,
}

export class InternalSnapClient {
    static async create(params?: IInternalSnapClientParams): Promise<InternalSnapClient> {
        const inner = await SnapClient.create(params);

        return new InternalSnapClient(inner);
    }

    async register(toOrigin: TOrigin): Promise<true> {
        const body: IIdentityAddRequest = { toOrigin };

        return this.inner._requestSnap(SNAP_METHODS.identity.protected_add, body);
    }

    async login(toOrigin: TOrigin, withIdentityId: TIdentityId, withDeriviationOrigin: TOrigin = toOrigin): Promise<true> {
        const body: IIdentityLoginRequest = { toOrigin, withDeriviationOrigin, withIdentityId };

        return this.inner._requestSnap(SNAP_METHODS.identity.protected_login, body);
    }

    async getOriginData(origin: TOrigin): Promise<IOriginData | null> {
        const body: IStateGetOriginDataRequest = { origin };

        return this.inner._requestSnap(SNAP_METHODS.state.protected_getOriginData, body);
    }

    async getEntropy(salt: Uint8Array): Promise<Uint8Array> {
        return this.inner.getEntropy(salt);
    }

    constructor(private inner: SnapClient) { }
}