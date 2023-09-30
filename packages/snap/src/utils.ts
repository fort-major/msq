import { ErrorCode, SNAP_METHODS, TIdentityId, TOrigin, err, hexToBytes, strToBytes } from "@fort-major/masquerade-shared";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";

// this is executed during the 'verify' build step process
// when the snap is evaluated in SES
// if it passes during the build step, it will also pass in runtime
if (!process.env.MSQ_SNAP_SITE_ORIGIN) {
    throw new Error(`Bad build: snap site origin is '${process.env.MSQ_SNAP_SITE_ORIGIN}'`);
}

// protected methods are those which could be executed only 
// from the Masquerade website
// TODO: MAKE THIS AUTOMATIC
const PROTECTED_METHODS = [
    SNAP_METHODS.identity.protected_add,
    SNAP_METHODS.identity.protected_login,
    SNAP_METHODS.identity.protected_getLoginOptions,
    SNAP_METHODS.state.protected_getOriginData,
    SNAP_METHODS.icrc1.protected_showTransferConfirm,
];

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

export async function getSignIdentity(origin: TOrigin, identityId: TIdentityId, customSalt: Uint8Array = new Uint8Array(0)) {
    const saltStr = `identity-sign\n${origin}\n${identityId}\n${customSalt}`;
    const entropyPre = await getEntropy(strToBytes(saltStr));

    // hashing second time to apply custom salt
    const entropyPreBytes = new Uint8Array([...entropyPre, ...customSalt]);
    const entropy = await crypto.subtle.digest('SHA-256', entropyPreBytes);

    return Secp256k1KeyIdentity.fromSecretKey(entropy);
}

export async function getEntropy(salt: Uint8Array): Promise<Uint8Array> {
    let entropy: string = await snap.request({
        method: "snap_getEntropy",
        params: {
            version: 1,
            salt: `\x0amasquerade-snap`
        }
    });

    return hexToBytes(entropy.slice(2));
}