import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { ErrorCode, SNAP_METHODS, ZSnapRPCRequest, err, toCBOR } from 'internet-computer-snap-shared';
import { protected_handleIdentityLogin, handleIdentityLogoutRequest as handleIdentityRequestLogout, handleIdentityLinkRequest, handleIdentityUnlinkRequest, handleAgentQuery, handleAgentCall, handleAgentCreateReadStateRequest, handleAgentReadState, handleAgentGetPrincipal, protected_handleIdentityAdd, protected_handleStateGetOriginData, handleIcrc1TransferRequest, handleEntropyGet } from './protocols';
import { guardMethods as guardProtectedMethods } from './utils';


export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
    const req = ZSnapRPCRequest.parse(request);

    // restrict access to protected methods to be only executed
    // from the Internet Computer Snap website
    guardProtectedMethods(req.method, origin);

    let result: any;

    switch (request.method) {
        // ------ AGENT RELATED METHODS --------
        case SNAP_METHODS.agent.query: {
            result = handleAgentQuery(req.params.body, origin);
            break;
        }

        case SNAP_METHODS.agent.call: {
            result = handleAgentCall(req.params.body, origin);
            break;
        }

        case SNAP_METHODS.agent.createReadStateRequest: {
            result = handleAgentCreateReadStateRequest(req.params.body, origin);
            break;
        }

        case SNAP_METHODS.agent.readState: {
            result = handleAgentReadState(req.params.body, origin);
            break;
        }

        case SNAP_METHODS.agent.getPrincipal: {
            result = handleAgentGetPrincipal(origin);
            break;
        }

        // ------ STATE RELATED METHODS -----------
        case SNAP_METHODS.state.protected_getOriginData: {
            result = protected_handleStateGetOriginData(req.params.body);
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

        case SNAP_METHODS.identity.requestLogout: {
            result = handleIdentityRequestLogout(origin);
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

        // ------ ICRC-1 RELATED METHODS ----------
        case SNAP_METHODS.icrc1.requestTransfer: {
            result = handleIcrc1TransferRequest(req.params.body, origin);
            break;
        }

        // ------ ENTROPY RELATED METHODS ---------
        case SNAP_METHODS.entropy.get: {
            result = handleEntropyGet(req.params.body, origin);
            break;
        }

        // ----------------------------------------

        default: {
            err(ErrorCode.INVALID_RPC_METHOD, request.method);
        }
    }

    return toCBOR(await result);
};