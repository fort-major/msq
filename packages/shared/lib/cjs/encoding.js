"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromCBOR = exports.toCBOR = exports.hexToBytes = exports.bytesToHex = exports.bytesToStr = exports.strToBytes = void 0;
const principal_1 = require("@dfinity/principal");
const cbor_x_1 = require("cbor-x");
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
// encodes a utf-8 string as bytes
const strToBytes = (str) => textEncoder.encode(str);
exports.strToBytes = strToBytes;
// decodes a utf-8 string out of the provided bytes
const bytesToStr = (bytes) => textDecoder.decode(bytes);
exports.bytesToStr = bytesToStr;
// encodes a byte array as hex string
const bytesToHex = (bytes) => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
exports.bytesToHex = bytesToHex;
// decodes a byte array out of the hex string
const hexToBytes = (hexString) => {
    const matches = hexString.match(/.{1,2}/g);
    if (matches == null) {
        throw new Error("Invalid hexstring");
    }
    return Uint8Array.from(matches.map((byte) => parseInt(byte, 16)));
};
exports.hexToBytes = hexToBytes;
const cborEncoder = new cbor_x_1.Encoder();
(0, cbor_x_1.addExtension)({
    // @ts-expect-error
    Class: principal_1.Principal,
    tag: 40501,
    encode(prin, enc) {
        enc(prin.toUint8Array());
    },
    decode(data) {
        return principal_1.Principal.fromUint8Array(data);
    }
});
function toCBOR(obj) {
    return (0, exports.bytesToHex)(cborEncoder.encode(obj));
}
exports.toCBOR = toCBOR;
function fromCBOR(hex) {
    const obj = (0, exports.hexToBytes)(hex);
    return cborEncoder.decode(obj);
}
exports.fromCBOR = fromCBOR;
