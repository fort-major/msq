import {
  type PublicKey,
  Identity,
  type Signature,
  DerEncodedPublicKey,
  HttpAgentRequest,
  ReadRequest,
  CallRequest,
  SubmitRequestType,
  ReadRequestType,
  ReadStateRequest,
} from "@dfinity/agent";
import { type MsqClient } from "./client";
import {
  type IIdentitySignRequest,
  SNAP_METHODS,
  IIdentityGetPublicKeyRequest,
  makeAvatarSvg,
  Principal,
  IHttpAgentRequest,
  debugStringify,
} from "@fort-major/msq-shared";
import { SECP256K1_OID, wrapDER } from "./der";

/**
 * ## An identity that proxies all incoming `sign` requests to the MSQ Snap
 */
export class MsqIdentity implements Identity {
  private constructor(
    private readonly client: MsqClient,
    private readonly publicKey: Secp256k1PublicKeyLite,
    public salt: Uint8Array,
  ) {}

  /**
   * ## Creates an instance of {@link MsqIdentity}
   *
   * Don't create this object manually, unless you know what you're doing. Use {@link MsqClient.requestLogin} instead.
   *
   * @param client - {@link MsqClient}
   * @param salt - (optional) {@link Uint8Array} - salt for custom key deriviation
   * @returns
   */
  public static async create(client: MsqClient, salt: Uint8Array = new Uint8Array()): Promise<MsqIdentity> {
    const body: IIdentityGetPublicKeyRequest = { salt };
    const rawPubkey: ArrayBuffer = await client._requestSnap(SNAP_METHODS.public.identity.getPublicKey, body);

    return new MsqIdentity(client, Secp256k1PublicKeyLite.fromRaw(rawPubkey), salt);
  }

  /**
   * ## Returns a principal of the underlying Secp256k1 public key of this identity
   *
   * __WARNING!__
   *
   * Since the user controls their authorization session and is able to log out from a website via the snap,
   * this function may return an outdated principal. This means, that if the sign function fails, this
   * principal is also invalid, until the user is authorized again. In order to fix this, we need this function to be
   * asynchronous, but this is impossible, until Dfinity decides to update the interface.
   *
   * @see {@link snapVerifyAndSign}
   *
   * @returns {Principal}
   */
  getPrincipal(): Principal {
    return Principal.selfAuthenticating(new Uint8Array(this.publicKey.toDer()));
  }

  /**
   * ## Returns user's pseudonym for current MSQ identity
   *
   * This pseudonym does not contain meaningful information
   * and should be treated as an easy way to render the username for users without profiles.
   *
   * @returns {Promise<string>} pseudonym
   */
  getPseudonym(): Promise<string> {
    return this.client._requestSnap(SNAP_METHODS.public.identity.getPseudonym);
  }

  /**
   * ## Returns user's avatar for current MSQ identity
   *
   * This avatar is an auto-generated SVG image
   * and should be treated as an easy way to render avatars for users without profiles.
   *
   * @param {string | undefined} bgColor
   * @returns {Promise<string>} avatar SVG src string as "data:image/svg+xml..."
   */
  getAvatarSrc(bgColor?: string): Promise<string> {
    const principal = this.getPrincipal();
    const svg = btoa(makeAvatarSvg(principal, bgColor));

    return Promise.resolve(`data:image/svg+xml;base64,${svg}`);
  }

  /**
   * ## Sends the body of the request to the Snap, which verifies it, calculates the requestId and signs it, returning the signature
   *
   * Implements [Identity.transformRequest]
   *
   * @param {HttpAgentRequest} request
   * @returns
   */
  async transformRequest(request: HttpAgentRequest): Promise<unknown> {
    const { body, ...fields } = request;

    return {
      ...fields,
      body: {
        content: body,
        sender_pubkey: this.publicKey.toDer(),
        sender_sig: await this.snapVerifyAndSign(body),
      },
    };
  }

  private async snapVerifyAndSign(req: ReadRequest | CallRequest): Promise<Signature> {
    const sender = req.sender instanceof Uint8Array ? req.sender : req.sender.toText();

    let request: IHttpAgentRequest;

    if (req.request_type === SubmitRequestType.Call || req.request_type === ReadRequestType.Query) {
      const r = req as CallRequest;

      request = {
        ...r,
        request_type: req.request_type,
        canister_id: r.canister_id.toText(),
        method_name: r.method_name,
        arg: r.arg,
        sender,
        // @ts-expect-error accessing a private property
        ingress_expiry: r.ingress_expiry._value,
      };
    } else {
      const r = req as ReadStateRequest;

      request = {
        ...r,
        request_type: req.request_type,
        paths: req.paths,
        sender,
        // @ts-expect-error accessing a private property
        ingress_expiry: r.ingress_expiry._value,
      };
    }

    const body: IIdentitySignRequest = {
      request,
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
