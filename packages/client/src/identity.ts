import { type PublicKey, SignIdentity, type Signature } from "@dfinity/agent";
import { type MasqueradeClient } from "./client";
import { Secp256k1PublicKey } from "@dfinity/identity-secp256k1";
import { type IIdentitySignRequest, SNAP_METHODS } from "@fort-major/masquerade-shared";

/**
 * ## An identity that proxies all incoming `sign` requests to the Masquerade Snap
 */
export class MasqueradeIdentity extends SignIdentity {
  private constructor(
    private readonly client: MasqueradeClient,
    private readonly publicKey: Secp256k1PublicKey,
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
  public static async create(client: MasqueradeClient): Promise<MasqueradeIdentity> {
    const rawPubkey: ArrayBuffer = await client._requestSnap(SNAP_METHODS.public.identity.getPublicKey);

    return new MasqueradeIdentity(client, Secp256k1PublicKey.fromRaw(rawPubkey));
  }

  /**
   * ## Returns Secp256k1 public key of this identity
   *
   * __WARNING!__
   *
   * Since the user controls their authorization session and is able to log out from a website via the snap,
   * this function may return an outdated public key. This means, that if the sign function fails, this public
   * key is also invalid, until the user is authorized again. In order to fix this, we need this function to be
   * asynchronous, but this is impossible, until Dfinity decides to update the interface.
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
    };

    return await this.client._requestSnap(SNAP_METHODS.public.identity.sign, body);
  }
}
