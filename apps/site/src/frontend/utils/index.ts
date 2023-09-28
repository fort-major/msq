import { TIdentityId, TOrigin, strToBytes } from "@fort-major/masquerade-shared";
import { Ed25519KeyIdentity } from '@dfinity/identity'
import { InternalSnapClient } from "@fort-major/masquerade-client/dist/esm/internal";
import nacl from "tweetnacl";

export async function createIdentityForOrigin(
    client: InternalSnapClient,
    origin: TOrigin,
    identityId: TIdentityId
): Promise<Ed25519KeyIdentity> {
    const salt = strToBytes(`\xcamasquerade-site\norigin\n${origin}\n${identityId}`);
    const entropy = await client.getEntropy(salt);
    const keyPair = nacl.sign.keyPair.fromSeed(entropy)

    return Ed25519KeyIdentity.fromKeyPair(keyPair.publicKey.buffer, keyPair.secretKey.buffer);
}

export async function createIdentityForCanisterId(
    client: InternalSnapClient,
    canisterId: string,
    identityId: TIdentityId
) {
    const salt = strToBytes(`\xcamasquerade-site\ncanisterId\n${canisterId}\n${identityId}`);

    const entropy = await client.getEntropy(salt);
    const keyPair = nacl.sign.keyPair.fromSeed(entropy)

    return Ed25519KeyIdentity.fromKeyPair(keyPair.publicKey.buffer, keyPair.secretKey.buffer);
}