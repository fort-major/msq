import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { ErrorCode, SNAP_METHODS, ZSnapRPCRequest, err, toCBOR, zodParse } from '@fort-major/masquerade-shared';
import { guardMethods as guardProtectedMethods } from './utils';
import { protected_handleShowICRC1TransferConfirm } from './protocols/icrc1';
import { handleSessionExists, protected_handleStateGetOriginData } from './protocols/state';
import { handleIdentityGetLinks, handleIdentityGetPublicKey, handleIdentityLinkRequest, handleIdentityLogoutRequest, handleIdentitySign, handleIdentityUnlinkRequest, protected_handleIdentityAdd, protected_handleIdentityGetLoginOptions, protected_handleIdentityLogin } from './protocols/identity';


export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
    const req = zodParse(ZSnapRPCRequest, request);

    // restrict access to protected methods to be only executed
    // from the Internet Computer Snap website
    guardProtectedMethods(req.method, origin);

    let result: Promise<any>;

    switch (request.method) {
        // ------ STATE RELATED METHODS -----------
        case SNAP_METHODS.state.protected_getOriginData: {
            result = protected_handleStateGetOriginData(req.params.body);
            break;
        }

        case SNAP_METHODS.state.sessionExists: {
            result = handleSessionExists(origin);
            break;
        }

        // ------ IDENTITY RELATED METHODS --------
        case SNAP_METHODS.identity.protected_add: {
            result = protected_handleIdentityAdd(req.params.body);
            break;
        }

        case SNAP_METHODS.identity.protected_login: {
            result = protected_handleIdentityLogin(req.params.body);
            break;
        }

        case SNAP_METHODS.identity.protected_getLoginOptions: {
            result = protected_handleIdentityGetLoginOptions(req.params.body);
            break;
        }

        case SNAP_METHODS.identity.sign: {
            result = handleIdentitySign(req.params.body, origin);
            break;
        }

        case SNAP_METHODS.identity.getPublicKey: {
            result = handleIdentityGetPublicKey(req.params.body, origin);
            break;
        }

        case SNAP_METHODS.identity.requestLogout: {
            result = handleIdentityLogoutRequest(origin);
            break;
        }

        case SNAP_METHODS.identity.requestLink: {
            result = handleIdentityLinkRequest(req.params.body, origin);
            break;
        }

        case SNAP_METHODS.identity.requestUnlink: {
            result = handleIdentityUnlinkRequest(req.params.body, origin);
            break;
        }

        case SNAP_METHODS.identity.getLinks: {
            result = handleIdentityGetLinks(origin);
            break;
        }

        // ------ ICRC1 RELATED METHODS -----------

        case SNAP_METHODS.icrc1.protected_showTransferConfirm: {
            result = protected_handleShowICRC1TransferConfirm(req.params.body);
            break;
        }

        // ----------------------------------------

        default: {
            err(ErrorCode.INVALID_RPC_METHOD, request.method);
        }
    }

    return toCBOR(await result);
};