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
  const matches = hexString.match(/[a-f0-9]{2}/g) ?? [];
  const result = Uint8Array.from(matches.map((byte) => parseInt(byte, 16)));

  if (matches === null || hexString.length % 2 !== 0 || result.length !== hexString.length / 2)
    throw new Error("Invalid hexstring");

  return result;
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
 * Returns pretty-string of a token amount
 * For example, 1001000 e8s would transform into 1.001, and 1001001000 e8s - into 1`001.001
 *
 * @param {bigint} qty - the amount of tokens
 * @param {number} decimals - the position of decimal point of this token
 * @param {boolean} padTail - if true, the result will be correctly padded with zeros at the end
 * @param {boolean} insertQuotes - if true, the result's whole part will be separated by thousands with quotemarks
 * @returns {string}
 */
export function tokensToStr(
  qty: bigint,
  decimals: number,
  padTail: boolean = false,
  insertQuotes: boolean = false,
): string {
  // 0.0 -> 0
  if (qty === BigInt(0)) {
    return "0";
  }

  // todo: Math.pow() to bitshift
  const decimalDiv = BigInt(Math.pow(10, decimals));

  const head = qty / decimalDiv;
  const tail = qty % decimalDiv;

  let headFormatted = head.toString();

  // 1000000.0 -> 1'000'000.0
  if (insertQuotes) {
    headFormatted = headFormatted.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, "'");
  }

  // 1,000.0 -> 1,000
  if (tail === BigInt(0)) {
    return headFormatted;
  }

  // 1'000.10 -> 1'000.00000010
  const tailFormatted = tail.toString().padStart(decimals, "0");

  // 1'000.00012300 -> 1'000.000123
  let tailPadded: string = tailFormatted;
  if (!padTail) {
    while (tailPadded.charAt(tailPadded.length - 1) === "0") {
      tailPadded = tailPadded.slice(0, -1);
    }
  }

  return `${headFormatted}.${tailPadded}`;
}

/**
 * The reverse of [tokensToStr] function
 *
 * @param {string} str
 * @param {number} decimals
 * @returns {bigint}
 */
export function strToTokens(str: string, decimals: number): bigint {
  // 1'000.123 -> 1'000 & 123
  let [head, tail] = str.split(".") as [string, string | undefined];
  // 1'000 -> 1000
  head = head.replaceAll("'", "");

  // todo: Math.pow() to bitshift
  const decimalMul = BigInt(Math.pow(10, decimals));

  if (!tail) {
    return BigInt(head) * decimalMul;
  }

  // 00001000 -> 1000
  let i = 0;
  while (tail.charAt(0) === "0") {
    tail = tail.slice(1, tail.length);
    i++;
  }

  if (tail === "") {
    return BigInt(head) * decimalMul;
  }

  if (tail.length > decimals) {
    throw `Too many decimal digits (max ${decimals})`;
  }

  // 123 -> 12300000
  tail = tail.padEnd(decimals - i, "0");

  return BigInt(head) * decimalMul + BigInt(tail);
}

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
