import { IMask, IStateGetAllAssetDataResponse, IStateGetAllOriginDataResponse } from "@fort-major/masquerade-shared";
import { StateManager } from "../state";

export async function protected_handleStateGetAllOriginData(): Promise<IStateGetAllOriginDataResponse> {
  const manager = await StateManager.make();

  const allOriginData = manager.getAllOriginData();
  const allOriginDataExternal: IStateGetAllOriginDataResponse = {};

  for (let origin of Object.keys(allOriginData)) {
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

export async function protected_handleStateGetAllAssetData(): Promise<IStateGetAllAssetDataResponse> {
  const manager = await StateManager.make();

  const allAssetData = manager.getAllAssetData();
  const allAssetDataExternal: IStateGetAllAssetDataResponse = {};

  for (let assetId of Object.keys(allAssetData)) {
    const data = allAssetData[assetId]!;

    allAssetDataExternal[assetId] = {
      accounts: Object.values(data.accounts) as string[],
    };
  }

  return allAssetDataExternal;
}
