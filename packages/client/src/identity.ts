import { type PublicKey, SignIdentity, type Signature } from "@dfinity/agent";
import { type MasqueradeClient } from "./client";
import { Secp256k1PublicKey } from "@dfinity/identity-secp256k1";
import {
  type IIdentityGetPublicKeyRequest,
  type IIdentitySignRequest,
  SNAP_METHODS,
} from "@fort-major/masquerade-shared";

/**
 * ## An identity that proxies all incoming `sign` requests to the Masquerade Snap
 */
export class MasqueradeIdentity extends SignIdentity {
  private constructor(
    private readonly client: MasqueradeClient,
    private readonly publicKey: Secp256k1PublicKey,
    public readonly salt: Uint8Array | undefined,
  ) {
    super();
  }

  /**
   * ## Creates an instance of {@link MasqueradeIdentity}
   *
   * Don't create this object manually, unless you know what you're doing. Use {@link MasqueradeClient.requestLogin} instead.
   *
   * @param client - {@link MasqueradeClient}
   * @param salt - (optional) {@link Uint8Array} - salt for custom key deriviation
   * @returns
   */
  public static async create(client: MasqueradeClient, salt?: Uint8Array | undefined): Promise<MasqueradeIdentity> {
    const body: IIdentityGetPublicKeyRequest = {
      salt,
    };
    const rawPubkey: ArrayBuffer = await client._requestSnap(SNAP_METHODS.public.identity.getPublicKey, body);

    return new MasqueradeIdentity(client, Secp256k1PublicKey.fromRaw(rawPubkey), salt);
  }

  /**
   * ## Derives another identity from `the main` one
   *
   * Deterministically creates additional Secp256k1 signing identities based on the passed `salt`.
   * Passing empty `salt` will yield `the main` identity.
   *
   * @param salt
   * @returns
   */
  public async deriveAnother(salt: Uint8Array): Promise<MasqueradeIdentity> {
    return await MasqueradeIdentity.create(this.client, salt);
  }

  /**
   * ## Returns Secp256k1 public key of this identity
   *
   * __WARNING!__
   *
   * Since the user controls their authorization session and is able to log out from a website via the snap,
   * this function may return an outdated public key. This means, that if the sign function fails, this public
   * key is also invalid, until the user is authorized again. In order to fix this, we need this function to be
   * asynchronous, but this is impossible, until Dfinity decides to do so.
   *
   * @see {@link sign}
   *
   * @returns
   */
  getPublicKey(): PublicKey {
    return this.publicKey;
  }

  /**
   * ## Signs an arbitrary blob of data with Secp256k1 by passing it to the Masquerade snap
   *
   * This function will only work if the user is logged in. Otherwise it throws an error.
   *
   * @see {@link getPublicKey}
   *
   * @param blob
   * @returns
   */
  async sign(blob: ArrayBuffer): Promise<Signature> {
    const body: IIdentitySignRequest = {
      challenge: blob,
      salt: this.salt,
    };

    return await this.client._requestSnap(SNAP_METHODS.public.identity.sign, body);
  }
}
