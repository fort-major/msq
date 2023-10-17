import { atom } from "nanostores";
import { MasqueradeIdentity, InternalSnapClient } from "@fort-major/masquerade-client";

export const $identity = atom<MasqueradeIdentity | null>(null);
export const $snapClient = atom<InternalSnapClient | null>(null);

export async function $initUserStores() {
  if ($identity.get() !== null && $snapClient.get() !== null) {
    return;
  }

  const client = await InternalSnapClient.create({
    snapId: import.meta.env.VITE_MSQ_SNAP_ID,
    snapVersion: import.meta.env.VITE_MSQ_SNAP_VERSION,
  });

  const identity = await MasqueradeIdentity.create(client.getInner());

  $identity.set(identity);
  $snapClient.set(client);
}
