import { IStateGetAllOriginDataResponse } from "@fort-major/masquerade-shared";
import { StateManager } from "../state";

export async function protected_handleStateGetAllOrigindata(): Promise<IStateGetAllOriginDataResponse> {
  const manager = await StateManager.make();

  return manager.getAllOriginData();
}
