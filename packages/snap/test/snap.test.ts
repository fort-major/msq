import { installSnap } from '@metamask/snaps-jest';
import { IIdentityGetLoginOptionsRequest, IIdentityLoginRequest, SNAP_METHODS, ZIdentityGetLoginOptionsResponse, fromCBOR, toCBOR, zodParse } from '@fort-major/masquerade-shared';
import { Json } from '@metamask/snaps-types';

function ok(resp: { result: Json } | { error: Json }): Json {
    const er = (resp as { error: Json }).error;

    if (er) throw new Error(JSON.stringify(er));

    return (resp as { result: Json }).result;
}

const MASQUERADE_SNAP_SITE = 'http://localhost:8000';

describe('Masquerade snap', () => {
    it('should have no session by default', async () => {
        const snap = await installSnap();

        const { response } = await snap.request({
            origin: 'http://localhost:8080',
            method: SNAP_METHODS.public.state.sessionExists,
            params: { body: toCBOR(undefined) },
        });

        expect(ok(response)).toBe(toCBOR(false));

        await snap.close();
    });

    it('should have at least one login option by default', async () => {
        const snap = await installSnap();

        const req: IIdentityGetLoginOptionsRequest = {
            forOrigin: 'http://localhost:8081',
        };

        const { response } = await snap.request({
            origin: MASQUERADE_SNAP_SITE,
            method: SNAP_METHODS.protected.identity.getLoginOptions,
            params: { body: toCBOR(req) },
        });

        const result = zodParse(ZIdentityGetLoginOptionsResponse, fromCBOR(ok(response) as string));

        expect(result.length).toBeGreaterThanOrEqual(1);

        await snap.close();
    });

    it('should create a session on login and remove it on logout', async () => {
        const snap = await installSnap();

        // login
        const req: IIdentityLoginRequest = {
            toOrigin: 'http://localhost:8081',
            withDeriviationOrigin: 'http://localhost:8081',
            withIdentityId: 0
        };

        const snapResp1 = await snap.request({
            origin: MASQUERADE_SNAP_SITE,
            method: SNAP_METHODS.protected.identity.login,
            params: { body: toCBOR(req) },
        });

        expect(ok(snapResp1.response)).toBe(toCBOR(true));

        // check session
        const snapResp2 = await snap.request({
            origin: 'http://localhost:8081',
            method: SNAP_METHODS.public.state.sessionExists,
            params: { body: toCBOR(undefined) }
        });

        expect(ok(snapResp2.response)).toBe(toCBOR(true));

        // logout
        const snapResp3Promise = snap.request({
            origin: 'http://localhost:8081',
            method: SNAP_METHODS.public.identity.requestLogout,
            params: { body: toCBOR(undefined) }
        });

        const ui = await snapResp3Promise.getInterface();
        await ui.ok();

        const snapResp3 = await snapResp3Promise;

        expect(ok(snapResp3.response)).toBe(toCBOR(true));

        // check session once again
        const snapResp4 = await snap.request({
            origin: 'http://localhost:8081',
            method: SNAP_METHODS.public.state.sessionExists,
            params: { body: toCBOR(undefined) }
        });

        expect(ok(snapResp4.response)).toBe(toCBOR(false));

        await snap.close();
    });

    it("should have no links by default", async () => {

    });

    it("shouldn't be possible to login via another website, without a link", async () => {
        const snap = await installSnap();

        const req: IIdentityLoginRequest = {
            toOrigin: 'http://localhost:8081',
            withDeriviationOrigin: 'http://localhost:8082',
            withIdentityId: 0
        };

        const snapResp1 = await snap.request({
            origin: MASQUERADE_SNAP_SITE,
            method: SNAP_METHODS.protected.identity.login,
            params: { body: toCBOR(req) },
        });

        expect(() => ok(snapResp1.response)).toThrowError();

        await snap.close();
    });
});