import { Principal } from "@dfinity/principal";
import { Encoder, addExtension } from 'cbor-x';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
// encodes a utf-8 string as bytes
export const strToBytes = (str) => textEncoder.encode(str);
// decodes a utf-8 string out of the provided bytes
export const bytesToStr = (bytes) => textDecoder.decode(bytes);
// encodes a byte array as hex string
export const bytesToHex = (bytes) => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
// decodes a byte array out of the hex string
export const hexToBytes = (hexString) => {
    const matches = hexString.match(/.{1,2}/g);
    if (matches == null) {
        throw new Error("Invalid hexstring");
    }
    return Uint8Array.from(matches.map((byte) => parseInt(byte, 16)));
};
const cborEncoder = new Encoder();
addExtension({
    // @ts-expect-error
    Class: Principal,
    tag: 40501,
    encode(prin, enc) {
        enc(prin.toUint8Array());
    },
    decode(data) {
        return Principal.fromUint8Array(data);
    }
});
export function toCBOR(obj) {
    return bytesToHex(cborEncoder.encode(obj));
}
export function fromCBOR(hex) {
    const obj = hexToBytes(hex);
    return cborEncoder.decode(obj);
}
