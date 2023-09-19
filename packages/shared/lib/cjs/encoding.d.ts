export declare const strToBytes: (str: string) => Uint8Array;
export declare const bytesToStr: (bytes: Uint8Array) => string;
export declare const bytesToHex: (bytes: Uint8Array) => string;
export declare const hexToBytes: (hexString: string) => Uint8Array;
export declare function toCBOR(obj: any): string;
export declare function fromCBOR(hex: string): any;
