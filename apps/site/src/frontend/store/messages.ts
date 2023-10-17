import {
  ErrorCode,
  IICRC1TransferRequestMsg,
  IICRC1TransferResultMsg,
  ILoginRequestMsg,
  ILoginResultMsg,
  IRequestReceivedMsg,
  ZICRC1TransferRequestMsg,
  ZLoginRequestMsg,
  ZMsgDomain,
  err,
} from "@fort-major/masquerade-shared";
import { atom } from "nanostores";

export const referrerOrigin = document.referrer ? new URL(document.referrer).origin : null;
export const $referrerWindow = atom<MessageEventSource | null>(null);
export const $loginRequestMsg = atom<ILoginRequestMsg | null>(null);
export const $icrc1TransferRequestMsg = atom<IICRC1TransferRequestMsg | null>(null);

window.onmessage = (msg) => {
  if (!msg) {
    return;
  }

  if (msg.origin !== referrerOrigin) {
    return;
  }

  if (!msg.source) {
    err(ErrorCode.UNKOWN, "No message source found");
  }

  try {
    ZMsgDomain.parse(msg.data["domain"]);

    if (msg.data["type"] === "login_request") {
      $loginRequestMsg.set(ZLoginRequestMsg.parse(msg.data));

      window.onbeforeunload = () => {
        sendLoginResult(false, null);
      };
    } else if (msg.data["type"] === "transfer_icrc1_request") {
      $icrc1TransferRequestMsg.set(ZICRC1TransferRequestMsg.parse(msg.data));

      window.onbeforeunload = () => {
        sendICRC1TransferResult(undefined, null);
      };
    } else {
      return;
    }

    $referrerWindow.set(msg.source);

    const readyMsg: IRequestReceivedMsg = {
      domain: "msq",
      type: "request_received",
    };

    msg.source!.postMessage(readyMsg, { targetOrigin: referrerOrigin });
  } catch (e) {
    window.onmessage = null;
    window.onbeforeunload = null;

    throw e;
  }
};

export function sendLoginResult(result: boolean, windowCloseDelayMs: number | null) {
  const res: ILoginResultMsg = {
    domain: "msq",
    type: "login_result",
    result,
  };
  $referrerWindow.get()!.postMessage(res, { targetOrigin: referrerOrigin! });

  window.onmessage = null;
  window.onbeforeunload = null;

  if (windowCloseDelayMs !== null) {
    setTimeout(window.close, windowCloseDelayMs);
  }
}

export function sendICRC1TransferResult(result: bigint | undefined, windowCloseDelayMs: number | null) {
  const res: IICRC1TransferResultMsg = {
    domain: "msq",
    type: "transfer_icrc1_result",
    result,
  };
  $referrerWindow.get()!.postMessage(res, { targetOrigin: referrerOrigin! });

  window.onmessage = null;
  window.onbeforeunload = null;

  if (windowCloseDelayMs !== null) {
    setTimeout(window.close, windowCloseDelayMs);
  }
}
