import { Principal } from "@dfinity/principal";
import { Decoder, Encoder, addExtension } from 'cbor-x';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// encodes a utf-8 string as bytes
export const strToBytes = (str: string): Uint8Array => textEncoder.encode(str);

// decodes a utf-8 string out of the provided bytes
export const bytesToStr = (bytes: Uint8Array): string => textDecoder.decode(bytes);

// encodes a byte array as hex string
export const bytesToHex = (bytes: Uint8Array): string =>
    bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

// decodes a byte array out of the hex string
export const hexToBytes = (hexString: string): Uint8Array => {
    const matches = hexString.match(/.{1,2}/g);

    if (matches == null) {
        throw new Error("Invalid hexstring");
    }

    return Uint8Array.from(matches.map((byte) => parseInt(byte, 16)));
}

// @ts-expect-error
const cborEncoder = new Encoder({ int64AsNumber: true });
// @ts-expect-error
const cborDecoder = new Decoder({ int64AsNumber: true });

addExtension<Principal, Uint8Array>({
    // @ts-expect-error
    Class: Principal,
    tag: 40501,
    encode(prin, enc) {
        enc(prin.toUint8Array())
    },
    decode(data) {
        return Principal.fromUint8Array(data);
    }
});

export function toCBOR(obj: any): string {
    return bytesToHex(cborEncoder.encode(obj));
}

export function fromCBOR(hex: string): any {
    const obj = hexToBytes(hex);

    return cborDecoder.decode(obj);
}