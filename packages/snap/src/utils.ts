import {
  ErrorCode,
  SNAP_METHODS,
  type TIdentityId,
  type TOrigin,
  type TProtectedSnapMethodsKind,
  err,
  hexToBytes,
} from "@fort-major/masquerade-shared";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";

// this is executed during the 'verify' build step process
// when the snap is evaluated in SES
// if it passes during the build step, it will also pass in runtime
if (process.env.MSQ_SNAP_SITE_ORIGIN === undefined) {
  throw new Error(`Bad build: snap site origin is '${process.env.MSQ_SNAP_SITE_ORIGIN}'`);
}

/**
 * A complete and automatically generated list of all protected methods
 *
 * @see {@link SNAP_METHODS}
 */
const PROTECTED_METHODS = Object.keys(SNAP_METHODS.protected).flatMap((key) =>
  Object.values(SNAP_METHODS.protected[key as TProtectedSnapMethodsKind]),
);

/**
 * ## Checks if the method is protected - can only be called from the Masquerade website
 *
 * If not - throws an error
 *
 * @param method
 * @param origin
 * @returns
 */
export function guardMethods(method: string, origin: TOrigin): void {
  // let other methods pass
  if (!PROTECTED_METHODS.includes(method)) {
    return;
  }

  // validate origin to be Masquerade website
  if (!isMasquerade(origin)) {
    return err(
      ErrorCode.PROTECTED_METHOD,
      `Method ${method} can only be executed from the Masquerade website ("${origin}" != ${process.env.MSQ_SNAP_SITE_ORIGIN})`,
    );
  }
}

/**
 * Checks if the provided origin is of the Masquerade website
 *
 * @param origin
 * @returns
 */
export function isMasquerade(origin: TOrigin): boolean {
  return origin === JSON.parse(process.env.MSQ_SNAP_SITE_ORIGIN as string);
}

/**
 * Derives a signing key pair from the provided arguments
 *
 * The key pair is different for each user, each origin, each user's identity and can be customized with salt
 *
 * @see {@link handleIdentitySign}
 * @see {@link handleIdentityGetPublicKey}
 *
 * @param origin
 * @param identityId
 * @param salt
 * @returns
 */
export async function getSignIdentity(
  origin: TOrigin,
  identityId: TIdentityId,
  salt?: Uint8Array | undefined,
): Promise<Secp256k1KeyIdentity> {
  // shared prefix may be used in following updates
  const entropy = await getEntropy(origin, identityId, "identity-sign\nshared", salt);

  return Secp256k1KeyIdentity.fromSecretKey(entropy);
}

async function getEntropy(
  origin: TOrigin,
  identityId: TIdentityId,
  internalSalt: string,
  customSalt: Uint8Array | undefined,
): Promise<ArrayBuffer> {
  const entropyPre: string = await snap.request({
    method: "snap_getEntropy",
    params: {
      version: 1,
      salt: `\x0amasquerade-snap\n${origin}\n${identityId}\n${internalSalt}`,
    },
  });

  let entropyPreBytes: Uint8Array;
  if (customSalt === undefined) {
    entropyPreBytes = new Uint8Array([...hexToBytes(entropyPre.slice(2))]);
  } else {
    entropyPreBytes = new Uint8Array([...hexToBytes(entropyPre.slice(2)), ...customSalt]);
  }

  return await crypto.subtle.digest("SHA-256", entropyPreBytes);
}
