import { type PublicKey, SignIdentity, type Signature, DerEncodedPublicKey } from "@dfinity/agent";
import { type MasqueradeClient } from "./client";
import {
  type IIdentitySignRequest,
  SNAP_METHODS,
  IIdentityGetPublicKeyRequest,
  makeAvatarSvg,
} from "@fort-major/masquerade-shared";
import { SECP256K1_OID, wrapDER } from "./der";

/**
 * ## An identity that proxies all incoming `sign` requests to the Masquerade Snap
 */
export class MasqueradeIdentity extends SignIdentity {
  private constructor(
    private readonly client: MasqueradeClient,
    private readonly publicKey: Secp256k1PublicKeyLite,
    public salt: Uint8Array,
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
  public static async create(
    client: MasqueradeClient,
    salt: Uint8Array = new Uint8Array(),
  ): Promise<MasqueradeIdentity> {
    const body: IIdentityGetPublicKeyRequest = { salt };
    const rawPubkey: ArrayBuffer = await client._requestSnap(SNAP_METHODS.public.identity.getPublicKey, body);

    return new MasqueradeIdentity(client, Secp256k1PublicKeyLite.fromRaw(rawPubkey), salt);
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

  getPseudonym(): Promise<string> {
    return this.client._requestSnap(SNAP_METHODS.public.identity.getPseudonym);
  }

  getAvatarSrc(bgColor?: string): Promise<string> {
    const principal = this.getPrincipal();
    const svg = btoa(makeAvatarSvg(principal, bgColor));

    return Promise.resolve(`data:image/svg+xml;base64,${svg}`);
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

// This is just a copy of a public key from this file https://github.com/dfinity/agent-js/blob/40d98004cd7cb1da7fe62794762b9ffc24a4d21e/packages/identity-secp256k1/src/secp256k1.ts
// Secp256k1 identity is a huge dependency, but we only need a public key part of it in our code, so we take it.
class Secp256k1PublicKeyLite implements PublicKey {
  public static fromRaw(rawKey: ArrayBuffer): Secp256k1PublicKeyLite {
    return new Secp256k1PublicKeyLite(rawKey);
  }

  private static derEncode(publicKey: ArrayBuffer): DerEncodedPublicKey {
    return wrapDER(publicKey, SECP256K1_OID).buffer as DerEncodedPublicKey;
  }

  readonly rawKey: ArrayBuffer;
  readonly derKey: DerEncodedPublicKey;

  // `fromRaw` and `fromDer` should be used for instantiation, not this constructor.
  private constructor(key: ArrayBuffer) {
    key.byteLength;
    this.rawKey = key;
    this.derKey = Secp256k1PublicKeyLite.derEncode(key);
  }

  public toDer(): DerEncodedPublicKey {
    return this.derKey;
  }

  public toRaw(): ArrayBuffer {
    return this.rawKey;
  }
}
