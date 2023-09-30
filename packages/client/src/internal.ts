import { IIdentityAddRequest, IIdentityGetLoginOptionsRequest, IIdentityGetLoginOptionsResponse, IIdentityLoginRequest, IOriginData, IShowICRC1TransferConfirmRequest, IStateGetOriginDataRequest, SNAP_METHODS, TIdentityId, TOrigin } from "@fort-major/masquerade-shared";
import { MasqueradeClient } from "./client";

export interface IInternalSnapClientParams {
    snapId?: string | undefined,
    snapVersion?: string | undefined,
    shouldBeFlask?: boolean | undefined,
    debug?: boolean | undefined,
}

export class InternalSnapClient {
    static async create(params?: IInternalSnapClientParams): Promise<InternalSnapClient> {
        const inner = await MasqueradeClient.create(params);

        return new InternalSnapClient(inner);
    }

    getInner() {
        return this.inner;
    }

    async register(toOrigin: TOrigin): Promise<true> {
        const body: IIdentityAddRequest = { toOrigin };

        return this.inner._requestSnap(SNAP_METHODS.identity.protected_add, body);
    }

    async login(toOrigin: TOrigin, withIdentityId: TIdentityId, withDeriviationOrigin: TOrigin = toOrigin): Promise<true> {
        const body: IIdentityLoginRequest = { toOrigin, withDeriviationOrigin, withIdentityId };

        return this.inner._requestSnap(SNAP_METHODS.identity.protected_login, body);
    }

    async getLoginOptions(forOrigin: TOrigin): Promise<IIdentityGetLoginOptionsResponse> {
        const body: IIdentityGetLoginOptionsRequest = {
            forOrigin
        };

        return this.inner._requestSnap(SNAP_METHODS.identity.protected_getLoginOptions, body);
    }

    async getOriginData(origin: TOrigin): Promise<IOriginData | null> {
        const body: IStateGetOriginDataRequest = { origin };

        return this.inner._requestSnap(SNAP_METHODS.state.protected_getOriginData, body);
    }

    async showICRC1TransferConfirm(body: IShowICRC1TransferConfirmRequest): Promise<boolean> {
        return this.inner._requestSnap(SNAP_METHODS.icrc1.protected_showTransferConfirm, body);
    }

    constructor(private inner: MasqueradeClient) { }
}