import { PublicKey, SignIdentity, Signature } from "@dfinity/agent";
import { MasqueradeClient } from "./client";
import { Secp256k1PublicKey } from "@dfinity/identity-secp256k1";
import { IIdentityGetPublicKeyRequest, IIdentitySignRequest, SNAP_METHODS } from "@fort-major/masquerade-shared";


export class MasqueradeIdentity extends SignIdentity {
    private constructor(
        private client: MasqueradeClient,
        private publicKey: Secp256k1PublicKey,
        private salt: Uint8Array | undefined
    ) {
        super();
    }

    public static async create(client: MasqueradeClient, salt?: Uint8Array | undefined): Promise<MasqueradeIdentity> {
        const body: IIdentityGetPublicKeyRequest = {
            salt
        };
        const rawPubkey: ArrayBuffer = await client._requestSnap(SNAP_METHODS.identity.getPublicKey, body);

        return new MasqueradeIdentity(client, Secp256k1PublicKey.fromRaw(rawPubkey), salt);
    }

    public async deriveAnother(salt: Uint8Array): Promise<MasqueradeIdentity> {
        return await MasqueradeIdentity.create(this.client, salt);
    }

    getPublicKey(): PublicKey {
        return this.publicKey;
    }

    sign(blob: ArrayBuffer): Promise<Signature> {
        const body: IIdentitySignRequest = {
            challenge: blob,
            salt: this.salt,
        };

        return this.client._requestSnap(SNAP_METHODS.identity.sign, body);
    }
}