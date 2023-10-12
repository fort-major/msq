import {
  type IIdentityAddRequest,
  type IIdentityGetLoginOptionsRequest,
  type IIdentityGetLoginOptionsResponse,
  type IIdentityLoginRequest,
  type IShowICRC1TransferConfirmRequest,
  type IStatistics,
  SNAP_METHODS,
  type TIdentityId,
  type TOrigin,
} from "@fort-major/masquerade-shared";
import { MasqueradeClient } from "./client";

export interface IInternalSnapClientParams {
  snapId?: string | undefined;
  snapVersion?: string | undefined;
  shouldBeFlask?: boolean | undefined;
  debug?: boolean | undefined;
}

export class InternalSnapClient {
  static async create(params?: IInternalSnapClientParams): Promise<InternalSnapClient> {
    const inner = await MasqueradeClient.create(params);

    return new InternalSnapClient(inner);
  }

  getInner(): MasqueradeClient {
    return this.inner;
  }

  async register(toOrigin: TOrigin): Promise<true> {
    const body: IIdentityAddRequest = { toOrigin };

    return await this.inner._requestSnap(SNAP_METHODS.protected.identity.add, body);
  }

  async login(
    toOrigin: TOrigin,
    withIdentityId: TIdentityId,
    withDeriviationOrigin: TOrigin = toOrigin,
  ): Promise<true> {
    const body: IIdentityLoginRequest = {
      toOrigin,
      withLinkedOrigin: withDeriviationOrigin,
      withIdentityId,
    };

    return await this.inner._requestSnap(SNAP_METHODS.protected.identity.login, body);
  }

  async getLoginOptions(forOrigin: TOrigin): Promise<IIdentityGetLoginOptionsResponse> {
    const body: IIdentityGetLoginOptionsRequest = {
      forOrigin,
    };

    return await this.inner._requestSnap(SNAP_METHODS.protected.identity.getLoginOptions, body);
  }

  async showICRC1TransferConfirm(body: IShowICRC1TransferConfirmRequest): Promise<boolean> {
    return await this.inner._requestSnap(SNAP_METHODS.protected.icrc1.showTransferConfirm, body);
  }

  async getStats(): Promise<IStatistics> {
    return await this.inner._requestSnap(SNAP_METHODS.protected.statistics.get);
  }

  async resetStats(): Promise<true> {
    return await this.inner._requestSnap(SNAP_METHODS.protected.statistics.reset);
  }

  constructor(private readonly inner: MasqueradeClient) {}
}
