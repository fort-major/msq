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
  IStateGetAllOriginDataResponse,
  IIdentityEditPseudonymRequest,
  IMask,
  IIdentityStopSessionRequest,
  IIdentityUnlinkOneRequest,
  IIdentityUnlinkAllRequest,
  IStateGetAllAssetDataResponse,
  IAssetDataExternal,
  IICRC1AddAssetRequest,
  IICRC1AddAssetAccountRequest,
  IICRC1EditAssetAccountRequest,
  IStateGetAllAssetDataRequest,
  IStateGetAllOriginDataRequest,
  unreacheable,
  IStatisticsData,
  IStatisticsIncrementRequest,
} from "@fort-major/msq-shared";
import { MsqClient } from "./client";

export class InternalSnapClient {
  static create(client: MsqClient | undefined): InternalSnapClient {
    return new InternalSnapClient(client);
  }

  private checkInnerSet(): asserts this is { inner: MsqClient } {
    if (!this.inner) unreacheable("Don't use uninitialized client");
  }

  getInner(): MsqClient {
    this.checkInnerSet();

    return this.inner;
  }

  async register(toOrigin: TOrigin): Promise<IMask | null> {
    this.checkInnerSet();

    const body: IIdentityAddRequest = { toOrigin };

    return await this.inner._requestSnap(SNAP_METHODS.protected.identity.add, body);
  }

  async login(
    toOrigin: TOrigin,
    withIdentityId: TIdentityId,
    withDeriviationOrigin: TOrigin = toOrigin,
  ): Promise<true> {
    this.checkInnerSet();

    const body: IIdentityLoginRequest = {
      toOrigin,
      withLinkedOrigin: withDeriviationOrigin,
      withIdentityId,
    };

    return await this.inner._requestSnap(SNAP_METHODS.protected.identity.login, body);
  }

  async getLoginOptions(forOrigin: TOrigin): Promise<IIdentityGetLoginOptionsResponse> {
    this.checkInnerSet();

    const body: IIdentityGetLoginOptionsRequest = { forOrigin };

    return await this.inner._requestSnap(SNAP_METHODS.protected.identity.getLoginOptions, body);
  }

  async getAllOriginData(origins?: string[]): Promise<IStateGetAllOriginDataResponse> {
    this.checkInnerSet();

    const body: IStateGetAllOriginDataRequest = { origins };

    return await this.inner._requestSnap(SNAP_METHODS.protected.state.getAllOriginData, body);
  }

  async getAllAssetData(assetIds?: string[]): Promise<IStateGetAllAssetDataResponse> {
    this.checkInnerSet();

    const body: IStateGetAllAssetDataRequest = { assetIds };

    return await this.inner._requestSnap(SNAP_METHODS.protected.state.getAllAssetData, body);
  }

  async addAsset(req: IICRC1AddAssetRequest): Promise<IAssetDataExternal[] | null> {
    this.checkInnerSet();

    return await this.inner._requestSnap(SNAP_METHODS.protected.icrc1.addAsset, req);
  }

  async addAssetAccount(assetId: string, assetName: string, assetSymbol: string): Promise<string | null> {
    this.checkInnerSet();

    const body: IICRC1AddAssetAccountRequest = { assetId, name: assetName, symbol: assetSymbol };

    return await this.inner._requestSnap(SNAP_METHODS.protected.icrc1.addAssetAccount, body);
  }

  async editAssetAccount(assetId: string, accountId: number, newName: string): Promise<void> {
    this.checkInnerSet();

    const body: IICRC1EditAssetAccountRequest = { assetId, accountId, newName };

    return await this.inner._requestSnap(SNAP_METHODS.protected.icrc1.editAssetAccount, body);
  }

  async editPseudonym(origin: TOrigin, identityId: TIdentityId, newPseudonym: string): Promise<void> {
    this.checkInnerSet();

    const body: IIdentityEditPseudonymRequest = {
      origin,
      identityId,
      newPseudonym,
    };

    return await this.inner._requestSnap(SNAP_METHODS.protected.identity.editPseudonym, body);
  }

  async stopSession(origin: TOrigin): Promise<boolean> {
    this.checkInnerSet();

    const body: IIdentityStopSessionRequest = {
      origin,
    };

    return await this.inner._requestSnap(SNAP_METHODS.protected.identity.stopSession, body);
  }

  async unlinkOne(origin: TOrigin, withOrigin: TOrigin): Promise<boolean> {
    this.checkInnerSet();

    const body: IIdentityUnlinkOneRequest = {
      origin,
      withOrigin,
    };

    return await this.inner._requestSnap(SNAP_METHODS.protected.identity.unlinkOne, body);
  }

  async unlinkAll(origin: TOrigin): Promise<boolean> {
    this.checkInnerSet();

    const body: IIdentityUnlinkAllRequest = {
      origin,
    };

    return await this.inner._requestSnap(SNAP_METHODS.protected.identity.unlinkAll, body);
  }

  async showICRC1TransferConfirm(body: IShowICRC1TransferConfirmRequest): Promise<boolean> {
    this.checkInnerSet();

    return await this.inner._requestSnap(SNAP_METHODS.protected.icrc1.showTransferConfirm, body);
  }

  async getStats(): Promise<IStatistics> {
    this.checkInnerSet();

    return await this.inner._requestSnap(SNAP_METHODS.protected.statistics.get);
  }

  async incrementStats(stats: Partial<IStatisticsData>): Promise<true> {
    this.checkInnerSet();

    const body: IStatisticsIncrementRequest = {
      data: stats,
    };

    return await this.inner._requestSnap(SNAP_METHODS.protected.statistics.get, body);
  }

  async resetStats(): Promise<true> {
    this.checkInnerSet();

    return await this.inner._requestSnap(SNAP_METHODS.protected.statistics.reset);
  }

  constructor(public readonly inner: MsqClient | undefined) {}
}
