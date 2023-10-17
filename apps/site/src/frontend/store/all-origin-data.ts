import { atom } from "nanostores";
import { $snapClient } from "./user";
import { IOriginData, IStateGetAllOriginDataResponse, TOrigin, debugStringify } from "@fort-major/masquerade-shared";

export const $allOriginData = atom<[TOrigin, IOriginData][] | null>(null);
export const $fetchOriginData = atom<boolean>(false);

$snapClient.subscribe((client) => {
  if (client !== null && $fetchOriginData.get()) {
    console.log("here1");

    client.getAllOrigindata().then(Object.entries).then($allOriginData.set);
  }
});

$fetchOriginData.subscribe((flag) => {
  const client = $snapClient.get();

  if (client !== null && flag) {
    client.getAllOrigindata().then(Object.entries).then($allOriginData.set);
  }
});
