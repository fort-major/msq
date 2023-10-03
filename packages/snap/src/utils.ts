import { ErrorCode, SNAP_METHODS, TIdentityId, TOrigin, TProtectedSnapMethodsKind, bytesToHex, err, hexToBytes, strToBytes } from "@fort-major/masquerade-shared";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";

// this is executed during the 'verify' build step process
// when the snap is evaluated in SES
// if it passes during the build step, it will also pass in runtime
if (!process.env.MSQ_SNAP_SITE_ORIGIN) {
    throw new Error(`Bad build: snap site origin is '${process.env.MSQ_SNAP_SITE_ORIGIN}'`);
}

const PROTECTED_METHODS = Object.keys(SNAP_METHODS.protected)
    .flatMap(key => Object.values(SNAP_METHODS.protected[key as TProtectedSnapMethodsKind]));

export function guardMethods(method: string, origin: TOrigin) {
    // let other methods pass
    if (!PROTECTED_METHODS.includes(method)) {
        return;
    }

    // validate origin to be Masquerade website
    if (!isMasquerade(origin)) {
        return err(ErrorCode.PROTECTED_METHOD, `Method ${method} can only be executed from the Masquerade website ("${origin}" != ${process.env.MSQ_SNAP_SITE_ORIGIN})`);
    }

    // pass if all good
    return;
}

export function isMasquerade(origin: TOrigin): boolean {
    return origin === JSON.parse(process.env.MSQ_SNAP_SITE_ORIGIN as string);
}

export async function getSignIdentity(origin: TOrigin, identityId: TIdentityId, salt?: Uint8Array | undefined) {
    const s = salt ? bytesToHex(salt) : "";
    // shared prefix may be used in following updates
    const saltStr = `\x0aidentity-sign\nshared\n${s}`;
    const entropy = await getEntropy(origin, identityId, strToBytes(saltStr));

    return Secp256k1KeyIdentity.fromSecretKey(entropy);
}

export async function getEntropy(origin: TOrigin, identityId: TIdentityId, salt: Uint8Array): Promise<ArrayBuffer> {
    const entropyPre: string = await snap.request({
        method: "snap_getEntropy",
        params: {
            version: 1,
            salt: `\x0amasquerade-snap\n${origin}\n${identityId}`
        }
    });

    const entropyPreBytes = new Uint8Array([...hexToBytes(entropyPre.slice(2)), ...salt]);

    return crypto.subtle.digest('SHA-256', entropyPreBytes);
}