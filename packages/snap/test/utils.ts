import { ErrorCode, debugStringify, err } from "@fort-major/masquerade-shared";
import { Json } from "@metamask/snaps-types";

export function ok(resp: { result: Json } | { error: Json }): Json {
  const er = (resp as { error: Json }).error;

  if (er) err(ErrorCode.UNWRAP_ERROR, debugStringify(er));

  return (resp as { result: Json }).result;
}

export const MASQUERADE_SNAP_SITE = "http://localhost:8000";
