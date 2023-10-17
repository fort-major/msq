import { MasqueradeIdentity, InternalSnapClient } from "@fort-major/masquerade-client";
import { atom, onMount, task } from "nanostores";

export const $identity = atom<MasqueradeIdentity | null>(null);
export const $snapClient = atom<InternalSnapClient | null>(null);

onMount($snapClient, () => {
  InternalSnapClient.create({
    snapId: import.meta.env.VITE_MSQ_SNAP_ID,
    snapVersion: import.meta.env.VITE_MSQ_SNAP_VERSION,
  }).then($snapClient.set);
});

$snapClient.subscribe((client) => {
  if (client !== null) {
    MasqueradeIdentity.create(client.getInner()).then($identity.set);
  }
});
