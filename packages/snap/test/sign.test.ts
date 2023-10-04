import { installSnap } from '@metamask/snaps-jest';
import { IIdentityGetLoginOptionsRequest, IIdentityGetPublicKeyRequest, IIdentityLinkRequest, IIdentityLoginRequest, IIdentitySignRequest, IIdentityUnlinkRequest, SNAP_METHODS, ZIdentityGetLoginOptionsResponse, bytesToHex, fromCBOR, toCBOR, zodParse } from '@fort-major/masquerade-shared';
import { MASQUERADE_SNAP_SITE, ok } from './utils';


describe('Signatures', () => {
    it("shouldn't be possible to sign without a session", async () => {
        const snap = await installSnap();

        const req: IIdentitySignRequest = {
            challenge: new Uint8Array([1, 2, 3, 4]),
        };

        const resp1 = await snap.request({
            origin: 'http://localhost:8080',
            method: SNAP_METHODS.public.identity.sign,
            params: { body: toCBOR(req) },
        });

        expect(() => ok(resp1.response)).toThrowError();

        await snap.close();
    });
    it("should be possible to sign with a session created", async () => {
        const snap = await installSnap();
        const site = 'http://localhost:8080';

        // login
        const req1: IIdentityLoginRequest = {
            toOrigin: site,
            withIdentityId: 0
        };

        const resp1 = await snap.request({
            origin: MASQUERADE_SNAP_SITE,
            method: SNAP_METHODS.protected.identity.login,
            params: { body: toCBOR(req1) }
        });

        expect(ok(resp1.response)).toBe(toCBOR(true));

        // sign
        const req2: IIdentitySignRequest = {
            challenge: new Uint8Array([1, 2, 3, 4]),
        };

        const resp2 = await snap.request({
            origin: site,
            method: SNAP_METHODS.public.identity.sign,
            params: { body: toCBOR(req2) },
        });

        const signature: Uint8Array = fromCBOR(ok(resp2.response) as string);
        expect(signature).toBeInstanceOf(Uint8Array);
        expect(signature.length).toBe(64);

        await snap.close();
    });
    it("same input should produce the same signature", async () => {
        const snap = await installSnap();
        const site = 'http://localhost:8080';

        // login
        const req1: IIdentityLoginRequest = {
            toOrigin: site,
            withIdentityId: 0
        };

        const resp1 = await snap.request({
            origin: MASQUERADE_SNAP_SITE,
            method: SNAP_METHODS.protected.identity.login,
            params: { body: toCBOR(req1) }
        });

        expect(ok(resp1.response)).toBe(toCBOR(true));

        // sign first time
        const req2: IIdentitySignRequest = {
            challenge: new Uint8Array([1, 2, 3, 4]),
        };

        const resp2 = await snap.request({
            origin: site,
            method: SNAP_METHODS.public.identity.sign,
            params: { body: toCBOR(req2) },
        });

        const signature1: Uint8Array = fromCBOR(ok(resp2.response) as string);

        // sign second time
        const resp3 = await snap.request({
            origin: site,
            method: SNAP_METHODS.public.identity.sign,
            params: { body: toCBOR(req2) },
        });

        const signature2: Uint8Array = fromCBOR(ok(resp3.response) as string);

        expect(toCBOR(signature1)).toBe(toCBOR(signature2));

        await snap.close();
    });
    it("different salt produces different signatures and pubkeys", async () => {
        const snap = await installSnap();
        const site = 'http://localhost:8080';

        // login
        const req1: IIdentityLoginRequest = {
            toOrigin: site,
            withIdentityId: 0
        };

        const resp1 = await snap.request({
            origin: MASQUERADE_SNAP_SITE,
            method: SNAP_METHODS.protected.identity.login,
            params: { body: toCBOR(req1) }
        });

        expect(ok(resp1.response)).toBe(toCBOR(true));

        const signaturesAndPubkeys: [Uint8Array, Uint8Array][] = [];

        for (let i = 0; i < 10; i++) {
            const req: IIdentitySignRequest = {
                challenge: new Uint8Array([1, 2, 3, 4]),
                salt: new Uint8Array([i])
            };

            const resp = await snap.request({
                origin: site,
                method: SNAP_METHODS.public.identity.sign,
                params: { body: toCBOR(req) },
            });

            const signature = fromCBOR(ok(resp.response) as string);

            const re1: IIdentityGetPublicKeyRequest = {
                salt: new Uint8Array([i])
            };

            const resp1 = await snap.request({
                origin: site,
                method: SNAP_METHODS.public.identity.getPublicKey,
                params: { body: toCBOR(re1) }
            });

            const pubkey = fromCBOR(ok(resp1.response) as string);

            signaturesAndPubkeys.push([signature, pubkey]);
        }

        const signatures = new Set();
        const pubkeys = new Set();

        for (let [s, p] of signaturesAndPubkeys) {
            signatures.add(toCBOR(s));
            pubkeys.add(toCBOR(p));
        }

        expect(signatures.size).toBe(10);
        expect(pubkeys.size).toBe(10);

        await snap.close();
    });
});