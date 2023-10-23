import { IStateGetAllAssetDataResponse, IStateGetAllOriginDataResponse } from "@fort-major/masquerade-shared";
import { StateManager } from "../state";

export async function protected_handleStateGetAllOriginData(): Promise<IStateGetAllOriginDataResponse> {
  const manager = await StateManager.make();

  return manager.getAllOriginData();
}

export async function protected_handleStateGetAllAssetData(): Promise<IStateGetAllAssetDataResponse> {
  const manager = await StateManager.make();

  return manager.getAllAssetData();
}
