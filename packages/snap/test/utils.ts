import { Json } from "@metamask/snaps-types";

export function ok(resp: { result: Json } | { error: Json }): Json {
    const er = (resp as { error: Json }).error;

    if (er) throw new Error(JSON.stringify(er));

    return (resp as { result: Json }).result;
}

export const MASQUERADE_SNAP_SITE = 'http://localhost:8000';