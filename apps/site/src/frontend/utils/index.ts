import { MasqueradeClient } from "@fort-major/masquerade-client/src/client";
import { MasqueradeIdentity } from "@fort-major/masquerade-client/src/identity";
import { strToBytes } from "@fort-major/masquerade-shared";

export function makeCanisterIdIdentity(client: MasqueradeClient, canisterId: string): Promise<MasqueradeIdentity> {
    const salt = `icrc-1\n${canisterId}\n0`;
    return MasqueradeIdentity.create(client, strToBytes(salt));
}