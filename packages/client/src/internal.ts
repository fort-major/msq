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

        return this.inner._requestSnap(SNAP_METHODS.protected.identity.add, body);
    }

    async login(toOrigin: TOrigin, withIdentityId: TIdentityId, withDeriviationOrigin: TOrigin = toOrigin): Promise<true> {
        const body: IIdentityLoginRequest = { toOrigin, withDeriviationOrigin, withIdentityId };

        return this.inner._requestSnap(SNAP_METHODS.protected.identity.login, body);
    }

    async getLoginOptions(forOrigin: TOrigin): Promise<IIdentityGetLoginOptionsResponse> {
        const body: IIdentityGetLoginOptionsRequest = {
            forOrigin
        };

        return this.inner._requestSnap(SNAP_METHODS.protected.identity.getLoginOptions, body);
    }

    async showICRC1TransferConfirm(body: IShowICRC1TransferConfirmRequest): Promise<boolean> {
        return this.inner._requestSnap(SNAP_METHODS.protected.icrc1.showTransferConfirm, body);
    }

    constructor(private inner: MasqueradeClient) { }
}