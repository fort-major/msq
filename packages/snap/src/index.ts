import type { OnRpcRequestHandler } from "@metamask/snaps-sdk";
import { ErrorCode, SNAP_METHODS, ZSnapRPCRequest, err, toCBOR, zodParse } from "@fort-major/msq-shared";
import { guardMethods as guardProtectedMethods } from "./utils";
import {
  protected_handleAddAsset,
  protected_handleAddAssetAccount,
  protected_handleEditAssetAccount,
  protected_handleShowICRC1TransferConfirm,
} from "./protocols/icrc1";
import {
  handleIdentityGetLinks,
  handleIdentityGetPseudonym,
  handleIdentityGetPublicKey,
  handleIdentityLinkRequest,
  handleIdentityLogoutRequest,
  handleIdentitySessionExists,
  handleIdentitySign,
  handleIdentityUnlinkRequest,
  protected_handleIdentityAdd,
  protected_handleIdentityEditPseudonym,
  protected_handleIdentityGetLoginOptions,
  protected_handleIdentityLogin,
  protected_handleIdentityStopSession,
  protected_handleIdentityUnlinkAll,
  protected_handleIdentityUnlinkOne,
} from "./protocols/identity";
import {
  protected_handleStatisticsGet,
  protected_handleStatisticsIncrement,
  protected_handleStatisticsReset,
} from "./protocols/statistics";
import { protected_handleStateGetAllAssetData, protected_handleStateGetAllOriginData } from "./protocols/state";
import { StateManager } from "./state";

/**
 * Snap main entrypoint. Expects a JSON-RPC request with `params` field of type `{ body: hex_cbor_encoded_body }`.
 * All inputs are validated with {@link https://github.com/colinhacks/zod | zod}.
 *
 * @see {@link https://docs.metamask.io/snaps/ | Metamask Snap Documentation}
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  const req = zodParse(ZSnapRPCRequest, request);

  // restrict access to protected methods to be only executed
  // from the MSQ Snap website
  guardProtectedMethods(req.method, origin);

  let result: Promise<unknown>;

  switch (request.method) {
    // ------ Protected methods ------

    case SNAP_METHODS.protected.identity.add: {
      result = protected_handleIdentityAdd(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.identity.login: {
      result = protected_handleIdentityLogin(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.identity.getLoginOptions: {
      result = protected_handleIdentityGetLoginOptions(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.identity.editPseudonym: {
      result = protected_handleIdentityEditPseudonym(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.identity.stopSession: {
      result = protected_handleIdentityStopSession(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.identity.unlinkOne: {
      result = protected_handleIdentityUnlinkOne(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.identity.unlinkAll: {
      result = protected_handleIdentityUnlinkAll(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.icrc1.showTransferConfirm: {
      result = protected_handleShowICRC1TransferConfirm(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.icrc1.addAsset: {
      result = protected_handleAddAsset(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.icrc1.addAssetAccount: {
      result = protected_handleAddAssetAccount(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.icrc1.editAssetAccount: {
      result = protected_handleEditAssetAccount(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.statistics.get: {
      result = protected_handleStatisticsGet();
      break;
    }

    case SNAP_METHODS.protected.statistics.increment: {
      result = protected_handleStatisticsIncrement(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.statistics.reset: {
      result = protected_handleStatisticsReset();
      break;
    }

    case SNAP_METHODS.protected.state.getAllOriginData: {
      result = protected_handleStateGetAllOriginData(req.params.body);
      break;
    }

    case SNAP_METHODS.protected.state.getAllAssetData: {
      result = protected_handleStateGetAllAssetData(req.params.body);
      break;
    }

    // ------ Public Methods ------

    case SNAP_METHODS.public.identity.sign: {
      result = handleIdentitySign(req.params.body, origin);
      break;
    }

    case SNAP_METHODS.public.identity.getPublicKey: {
      result = handleIdentityGetPublicKey(req.params.body, origin);
      break;
    }

    case SNAP_METHODS.public.identity.getPseudonym: {
      result = handleIdentityGetPseudonym(origin);
      break;
    }

    case SNAP_METHODS.public.identity.requestLogout: {
      result = handleIdentityLogoutRequest(origin);
      break;
    }

    case SNAP_METHODS.public.identity.requestLink: {
      result = handleIdentityLinkRequest(req.params.body, origin);
      break;
    }

    case SNAP_METHODS.public.identity.requestUnlink: {
      result = handleIdentityUnlinkRequest(req.params.body, origin);
      break;
    }

    case SNAP_METHODS.public.identity.getLinks: {
      result = handleIdentityGetLinks(origin);
      break;
    }

    case SNAP_METHODS.public.identity.sessionExists: {
      result = handleIdentitySessionExists(origin);
      break;
    }

    default: {
      err(ErrorCode.INVALID_RPC_METHOD, request.method);
    }
  }

  const res = toCBOR(await result);

  await StateManager.persist();

  return res;
};
