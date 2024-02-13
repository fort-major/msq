import {
  IMask,
  IStateGetAllAssetDataResponse,
  IStateGetAllOriginDataResponse,
  ZStateGetAllAssetDataRequest,
  ZStateGetAllOriginDataRequest,
  fromCBOR,
  zodParse,
} from "@fort-major/msq-shared";
import { StateManager } from "../state";

export async function protected_handleStateGetAllOriginData(bodyCBOR: string): Promise<IStateGetAllOriginDataResponse> {
  const body = zodParse(ZStateGetAllOriginDataRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  const allOriginData = manager.getAllOriginData();
  const allOriginDataExternal: IStateGetAllOriginDataResponse = {};

  const origins = body.origins ? body.origins : Object.keys(allOriginData);

  for (let origin of origins) {
    const data = allOriginData[origin]!;

    allOriginDataExternal[origin] = {
      masks: Object.values(data.masks) as IMask[],
      linksFrom: Object.keys(data.linksFrom),
      linksTo: Object.keys(data.linksTo),
      currentSession: data.currentSession,
    };
  }

  return allOriginDataExternal;
}

export async function protected_handleStateGetAllAssetData(bodyCBOR: string): Promise<IStateGetAllAssetDataResponse> {
  const body = zodParse(ZStateGetAllAssetDataRequest, fromCBOR(bodyCBOR));
  const manager = await StateManager.make();

  const allAssetData = manager.getAllAssetData();
  const allAssetDataExternal: IStateGetAllAssetDataResponse = {};

  const assetIds = body.assetIds ? body.assetIds : Object.keys(allAssetData);

  for (let assetId of assetIds) {
    const data = allAssetData[assetId];

    if (data) {
      allAssetDataExternal[assetId] = {
        accounts: Object.values(data.accounts) as string[],
      };
    }
  }

  return allAssetDataExternal;
}
