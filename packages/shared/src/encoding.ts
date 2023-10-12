import { Encoder } from "cbor-x";

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
 * Pretty-prints a JSON representation of the object, handling the bigint case
 *
 * @param obj
 * @returns
 */
export function debugStringify(obj: unknown): string {
  return JSON.stringify(obj, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
}
