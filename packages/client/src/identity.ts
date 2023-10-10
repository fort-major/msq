import { type PublicKey, SignIdentity, type Signature } from "@dfinity/agent";
import { type MasqueradeClient } from "./client";
import { Secp256k1PublicKey } from "@dfinity/identity-secp256k1";
import {
  type IIdentityGetPublicKeyRequest,
  type IIdentitySignRequest,
  SNAP_METHODS,
} from "@fort-major/masquerade-shared";

export class MasqueradeIdentity extends SignIdentity {
  private constructor(
    private readonly client: MasqueradeClient,
    private readonly publicKey: Secp256k1PublicKey,
    public readonly salt: Uint8Array | undefined,
  ) {
    super();
  }

  public static async create(
    client: MasqueradeClient,
    salt?: Uint8Array | undefined,
  ): Promise<MasqueradeIdentity> {
    const body: IIdentityGetPublicKeyRequest = {
      salt,
    };
    const rawPubkey: ArrayBuffer = await client._requestSnap(
      SNAP_METHODS.public.identity.getPublicKey,
      body,
    );

    return new MasqueradeIdentity(
      client,
      Secp256k1PublicKey.fromRaw(rawPubkey),
      salt,
    );
  }

  public async deriveAnother(salt: Uint8Array): Promise<MasqueradeIdentity> {
    return await MasqueradeIdentity.create(this.client, salt);
  }

  getPublicKey(): PublicKey {
    return this.publicKey;
  }

  async sign(blob: ArrayBuffer): Promise<Signature> {
    const body: IIdentitySignRequest = {
      challenge: blob,
      salt: this.salt,
    };

    return await this.client._requestSnap(
      SNAP_METHODS.public.identity.sign,
      body,
    );
  }
}
