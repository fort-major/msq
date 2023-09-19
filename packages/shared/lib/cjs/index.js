"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.err = exports.ok = exports.ERROR_CODES = exports.SNAP_METHODS = void 0;
const encoding_1 = require("./encoding");
__exportStar(require("./types"), exports);
__exportStar(require("./encoding"), exports);
exports.SNAP_METHODS = {
    agent: {
        getPrincipal: 'agent_getPrincipal',
        query: 'agent_query',
        call: 'agent_call',
        createReadStateRequest: 'agent_createReadStateRequest',
        readState: 'agent_readState',
    },
    identity: {
        protected_login: 'identity_protected_login',
        requestLogout: 'identity_requestLogout',
        requestShare: 'identity_requestShare',
        requestUnshare: 'identity_requestUnshare',
    },
    state: {
        protected_get: 'state_protected_get',
    },
    entropy: {
        get: 'entropy_get',
    },
    icrc1: {
        requestTransfer: 'icrc1_requestTransfer',
    }
};
var ERROR_CODES;
(function (ERROR_CODES) {
    ERROR_CODES[ERROR_CODES["UNKOWN"] = 0] = "UNKOWN";
    ERROR_CODES[ERROR_CODES["INVALID_RPC_METHOD"] = 1] = "INVALID_RPC_METHOD";
    ERROR_CODES[ERROR_CODES["INVALID_INPUT"] = 2] = "INVALID_INPUT";
    ERROR_CODES[ERROR_CODES["IC_ERROR"] = 3] = "IC_ERROR";
    ERROR_CODES[ERROR_CODES["PROTECTED_METHOD"] = 4] = "PROTECTED_METHOD";
    ERROR_CODES[ERROR_CODES["ICRC1_ERROR"] = 5] = "ICRC1_ERROR";
    ERROR_CODES[ERROR_CODES["METAMASK_ERROR"] = 6] = "METAMASK_ERROR";
})(ERROR_CODES || (exports.ERROR_CODES = ERROR_CODES = {}));
function ok(payload) {
    return { status: 'Ok', payload: (0, encoding_1.toCBOR)(payload) };
}
exports.ok = ok;
function err(code, msg) {
    return { status: 'Err', code, msg };
}
exports.err = err;
