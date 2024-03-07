import { Principal } from "@dfinity/principal";
import { Encoder } from "cbor-x";
import { Crc32 } from "@aws-crypto/crc32";
import jsSHA from "jssha";

export { Principal } from "@dfinity/principal";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * ## Encodes a utf-8 string as {@link Uint8Array}
 *
 * @see {@link bytesToStr}
 *
 * @param str
 * @returns
 */
export const strToBytes = (str: string): Uint8Array => textEncoder.encode(str);

/**
 * ## Decodes a {@link Uint8Array} into a utf-8 string
 *
 * @see {@link strToBytes}
 *
 * @param bytes
 * @returns
 */
export const bytesToStr = (bytes: Uint8Array): string => textDecoder.decode(bytes);

/**
 * ## Encodes {@link Uint8Array} into hex-string
 *
 * @see {@link hexToBytes}
 *
 * @param bytes
 * @returns
 */
export const bytesToHex = (bytes: Uint8Array): string =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");

/**
 * ## Decodes {@link Uint8Array} from hex-string
 *
 * @see {@link bytesToHex}
 *
 * @param hexString
 * @returns
 */
export const hexToBytes = (hexString: string): Uint8Array => {
  const matches = hexString.match(/.{1,2}/g);

  if (matches == null) {
    throw new Error("Invalid hexstring");
  }

  return Uint8Array.from(matches.map((byte) => parseInt(byte, 16)));
};

const cborEncoder = new Encoder();

/**
 * ## Encodes an object in CBOR and then in hex
 *
 * @see {@link fromCBOR}
 *
 * @param obj
 * @returns
 */
export function toCBOR(obj: unknown): string {
  return bytesToHex(cborEncoder.encode(obj));
}

/**
 * ## Decodes a hex string into bytes and then back into an object
 *
 * @see {@link toCBOR}
 *
 * @param hex
 * @returns
 */
export function fromCBOR<T>(hex: string): T {
  const obj = hexToBytes(hex);

  return cborEncoder.decode(obj);
}

/**
 * ## Encodes bigint as bytes (le)
 *
 * @param n
 * @returns
 */
export const bigIntToBytes = (n: bigint): Uint8Array => {
  let result = new Uint8Array(32);
  let i = 0;
  while (n > 0n) {
    result[i] = Number(n % 256n);
    n = n / 256n;
    i += 1;
  }
  return result;
};

/**
 * ## Decodes a bigint from bytes (le)
 *
 * @param bytes
 * @returns
 */
export const bytesToBigInt = (bytes: Uint8Array): bigint => {
  let result = 0n;
  let base = 1n;
  for (let byte of bytes) {
    result = result + base * BigInt(byte);
    base = base * 256n;
  }
  return result;
};

/**
 * Pretty-prints a JSON representation of the object, handling the bigint case
 *
 * @param obj
 * @returns
 */
export function debugStringify(obj: unknown): string {
  return JSON.stringify(
    obj,
    (_, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      } else if (value instanceof Error) {
        const error: any = {};

        Object.getOwnPropertyNames(value).forEach(function (propName) {
          error[propName] = (value as any)[propName];
        });

        return error;
      } else {
        return value;
      }
    },
    2,
  );
}
